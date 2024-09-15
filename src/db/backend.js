import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3001;

// Enable CORS to allow the frontend to make requests to the backend
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'bd'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// API endpoint to execute SQL queries
app.post('/api/query', (req, res) => {
  const sqlQuery = req.body.sqlQuery;

  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ error: 'Failed to execute query' });
      return;
    }
    // Return the query results as JSON
    res.json(results);
  });
});

// Updated /api/data endpoint to accept a custom SQL query
app.get('/api/data', (req, res) => {
  const { sqlQuery } = req.query;

  // Define the default SQL query or use the provided one
  const query = sqlQuery || 'SELECT * FROM Clientes;';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Failed to fetch data' });
      return;
    }
    // Return the fetched data as JSON
    res.json(results);
  });
});

// New endpoint to get data for a specific user
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch user details from Clientes
    const [userDetails] = await new Promise((resolve, reject) => {
      const sqlQuery = 'SELECT * FROM Clientes WHERE id_cliente = ?';
      db.query(sqlQuery, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (!userDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user's transactions from Transacciones
    const transactions = await new Promise((resolve, reject) => {
      const sqlQuery = 'SELECT * FROM Transacciones WHERE id_cliente = ?';
      db.query(sqlQuery, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    // Construct the JSON response
    const userResponse = {
      calificacion: userDetails.saldo_actual, // Assuming 'saldo_actual' is used for 'calificacion'
      categoriasFinancieras: {
        ahorros: userDetails.saldo_actual * 0.2, // Placeholder calculation
        inversiones: userDetails.saldo_actual * 0.3, // Placeholder calculation
        gastos: userDetails.saldo_actual * 0.5 // Placeholder calculation
      },
      gastosRecurrentes: transactions.map(transaction => ({
        nombre: transaction.tipo_transaccion,
        monto: transaction.monto
      })),
      recomendaciones: [
        "Reducir gastos innecesarios",
        "Aumentar el ahorro mensual"
      ],
      resumen: `En el último mes, tus gastos han sido de ${transactions.reduce((sum, t) => sum + t.monto, 0)}.`,
      historialCalificacion: transactions.map(transaction => ({
        mes: new Date(transaction.fecha_transaccion).toLocaleString('default', { month: 'long' }),
        calificacion: transaction.monto // Placeholder
      })),
      recomendacionesTarjetasCredito: [
        {
          nombre: "Tarjeta Platinum",
          beneficios: "1.5% cashback en todas las compras"
        },
        {
          nombre: "Tarjeta Gold",
          beneficios: "Sin cuota anual el primer año"
        }
      ]
    };

    // Return the constructed JSON
    res.json(userResponse);

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
