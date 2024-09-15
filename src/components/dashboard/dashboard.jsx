import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  // State to store the data fetched from the API
  const [data, setData] = useState(null);
  const userId = 1; // Assuming we're fetching data for user with ID 1

  // Fetch data from the API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/user/${userId}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  if (!data) {
    return <div>Loading...</div>;
  }

  // Data for the Doughnut chart (Financial Categories)
  const categoriasData = {
    labels: Object.keys(data.categoriasFinancieras),
    datasets: [
      {
        data: Object.values(data.categoriasFinancieras),
        backgroundColor: ['#003366', '#336699', '#6699CC'], // Blue shades
      },
    ],
  };

  // Data for the Line chart (Credit Score History)
  const historialData = {
    labels: data.historialCalificacion.map((item) => item.mes),
    datasets: [
      {
        label: 'Balance',
        data: data.historialCalificacion.map((item) => item.calificacion),
        fill: false,
        borderColor: '#1E90FF', // Bright blue
        tension: 0.1,
      },
    ],
  };

  // Extract numerical values from the summary, format to two decimal places, and add commas as decimal separators
  const formattedResumen = data.resumen.replace(/(\d+(\.\d+)?)/g, (match) =>
    parseFloat(match).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  return (
    <div className="dashboard">
      <div className="grid-container">
        {/* Calificación */}
        <div className="grid-item">
          <div className="widget calificacion">
            <h3>Calificación</h3>
            <p className="score">{data.calificacion}</p>
          </div>
        </div>

        {/* Financial Categories Doughnut Chart */}
        <div className="grid-item">
          <div className="widget categorias-financieras">
            <h3>Categorías Financieras</h3>
            <Doughnut data={categoriasData} />
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid-item">
          <div className="widget recomendaciones">
            <h3>Recomendaciones</h3>
            <ul>
              {data.recomendaciones.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary */}
        <div className="grid-item">
          <div className="widget resumen">
            <h3>Resumen</h3>
            <p>{formattedResumen}</p>
          </div>
        </div>

        {/* Credit Score History */}
        <div className="grid-item">
          <div className="widget historial-calificacion">
            <h3>Historial de Calificación</h3>
            <Line data={historialData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
