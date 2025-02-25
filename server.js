const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://postgres@localhost/acme_hr_directory"
);
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees;
        `;
        const response = await client.query(SQL)
        res.send(response.rows);
    } catch (error) {
        console.log('Unable to get employees');
        console.log(error);
        next(error);
    }
});

app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM departments;
        `;
        const response = await client.query(SQL)
        res.send(response.rows);
    } catch (error) {
        console.log('Unable to get departments');
        console.log(error);
        next(error);
    }
});

app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *;
        `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.log('Unable to create an employee');
        console.log(error);
        next(error);
    }
});

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM employees WHERE id = $1;
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        console.log('Unable to delete employee by id ' + req.params.id);
        console.log(error);
        next(error);
    }
});

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE employees SET name = $1, department_id = $2, updated_at = now() WHERE id = $3 RETURNING *;
        `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.log('Unable to update employee by id ' + req.params.id);
        console.log(error);
        next(error);
    }
});

const init = async () => {
  try {
    await client.connect();
    console.log("connected to database");
    let SQL = `
      DROP TABLE IF EXISTS employees;
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT NULL,
        department_id INTEGER NOT NULL
    );
      DROP TABLE IF EXISTS departments;
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
    );
    `;
    await client.query(SQL);
    console.log("tables created");
    SQL = `
        INSERT INTO departments (name) VALUES ('HR');
        INSERT INTO departments (name) VALUES ('Engineering');
        INSERT INTO departments (name) VALUES ('Sales');

        INSERT INTO employees (name, department_id) VALUES ('Moe', (SELECT id FROM departments WHERE name = 'HR'));
        INSERT INTO employees (name, department_id) VALUES ('Larry', (SELECT id FROM departments WHERE name = 'Engineering'));
        INSERT INTO employees (name, department_id) VALUES ('Curly', (SELECT id FROM departments WHERE name = 'Sales'));
    `;
    await client.query(SQL);
    console.log("data seeded");
    app.listen(3000, () => {
      console.log("listening on port 3000");
    });
  } catch (error) {
    console.log(error);
  }
};

init();