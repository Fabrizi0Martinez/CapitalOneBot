import { useState } from 'react';
import './App.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import Header from './components/header/header';
import Dashboard from './components/dashboard/dashboard';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';

const API_KEY = import.meta.env.VITE_OKEY;

const systemMessage = {
  role: 'system',
  content: `Eres un asistente de finanzas personales. Cuando necesites datos de la base de datos, genera la consulta SQL apropiada dentro de bloques de código triple backtick con la etiqueta 'sql'. Por ejemplo:

\`\`\`sql
SELECT * FROM Clientes WHERE id_cliente = 1;
CREATE SCHEMA IF NOT EXISTS bd DEFAULT CHARACTER SET utf8 COLLATE utf8_bin ;
USE bd;
CREATE TABLE Clientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    fecha_registro DATE,
    saldo_actual DECIMAL(10, 2),
    categoria_riesgo VARCHAR(20)
);

CREATE TABLE Transacciones (
    id_transaccion INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    fecha_transaccion DATE,
    tipo_transaccion VARCHAR(50),
    monto DECIMAL(10, 2),
    categoria VARCHAR(50),
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
);

siempre que una pregunta te lleve a necesitar datos, nunca preguntes y genera 1 query sql, usa una consulta solo de 1 query SQL basandote en la extructura proporcionada para obtenerlos con id 1.
ten en cuenta modismos para facilitar la interaccion con el usuario. Ejemplo:
fecha_transaccion - Fecha de Operación, Fecha de Movimiento, Fecha de Actividad,Fecha de Registro, Momento del Movimiento,Día del Registro.
tipo_transaccion - Tipo de Operación, Tipo de Movimiento, Tipo de Actividad, Tipo de Registro, Tipo de Movimiento, Tipo de Transacción, Clase de Movimiento, Categoría del Gasto/Ingreso.
monto - Cantidad, Importe, Valor, Suma, Total, Cantidad de Dinero.
categoria - Categoría, Clasificación, Tipo, Grupo, Sección, Rubro, Clase, Género, Segmento.

Tambien en caso que consideres idoneo puedes dar recomendaciones de tarjetas de credito, en base a los datos proporcionados, aqui te va contexto de las tarjetas:
La tarjeta Capital One Venture Rewards ofrece 2 millas por cada dólar gastado en todas las compras, un bono de bienvenida de 60,000 millas después de gastar $3,000 en los primeros tres meses, reembolso 
de hasta $100 en la tarifa de solicitud para Global Entry o TSA Pre✓®, y no cobra cargos por transacciones en el extranjero. La Capital One Quicksilver Cash Rewards brinda un 1.5% de reembolso ilimitado
en todas las compras, un bono de bienvenida de $200 tras gastar $500 en los primeros tres meses, sin cuota anual y un APR introductorio del 0% en compras y transferencias de saldo durante un período 
promocional. La Capital One Savor Cash Rewards ofrece un 4% de reembolso en comidas y entretenimiento, 2% en supermercados y 1% en todas las demás compras, con un bono de bienvenida de $300 después de gastar 
$3,000 en los primeros tres meses, aunque aplica una cuota anual. La Capital One Platinum es ideal para quienes desean construir o mejorar su historial crediticio, ofrece la posibilidad de aumentar el límite
de crédito después de seis pagos a tiempo y no tiene cuota anual. La Capital One VentureOne Rewards permite ganar 1.25 millas por cada dólar gastado, ofrece un bono de bienvenida de 20,000 millas tras gastar
$500 en los primeros tres meses, sin cuota anual y sin cargos por transacciones en el extranjero. La Capital One Spark Cash Plus para negocios proporciona un 2% de reembolso ilimitado en todas las compras 
empresariales, incluye hasta $1,000 en bonos de efectivo y aplica una cuota anual. Finalmente, la Capital One Secured Mastercard está diseñada para establecer o reconstruir crédito, requiere un depósito de
seguridad reembolsable, no tiene cuota anual y reporta a las tres principales agencias de crédito para ayudar a construir historial. 

Siempre que des informacion sobre una tarjeta, solo usa las pertenecientes a Capital One que te proporcioné, nunca preguntes al usuario por mas informacion, No busques las tarjetas en SQL, solo la informacion de los gastos, usa lo que ya tengas a tu disposicion,
menciona que contacten a un represetante para mas detalles.


\`\`\`
`,
};

function App() {
  const [messages, setMessages] = useState([
    {
      message: '¡Hola! Soy CapitalBot. ¡Pregúntame lo que quieras!',
      sentTime: 'just now',
      sender: 'CapitalBot',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentView, setCurrentView] = useState('chatbot'); // Estado para controlar la vista actual
  const [sqlQuery, setSqlQuery] = useState(''); // Store SQL query here

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: 'user',
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);

    // Procesar el mensaje con ChatGPT
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) {
    // Prepara los mensajes para la llamada a la API
    let apiMessages = chatMessages.map((messageObject) => {
      let role = '';
      if (messageObject.sender === 'CapitalBot') {
        role = 'assistant';
      } else {
        role = 'user';
      }
      return { role: role, content: messageObject.message };
    });

    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...apiMessages],
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      let botMessage = data.choices[0].message.content;

      // Verificar si la respuesta incluye un código SQL
      const sqlMatch = botMessage.match(/```sql\s*([\s\S]*?)```/i);

      if (sqlMatch) {
        console.log('La respuesta incluye un código SQL.');
        const sqlQuery = sqlMatch[1].trim();

        // Store the SQL query for the GET request
        setSqlQuery(sqlQuery);

        // Send a GET request to the server with the SQL query
        const queryResponse = await fetch(`http://localhost:3001/api/data?sqlQuery=${encodeURIComponent(sqlQuery)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!queryResponse.ok) {
          throw new Error('Failed to execute SQL query on the server');
        }

        const queryResults = await queryResponse.json();

        // Enviar los resultados de vuelta al modelo para procesarlos
        const newApiMessages = [
          ...apiMessages,
          { role: 'assistant', content: botMessage },
          { role: 'system', content: `Resultados de la consulta: ${JSON.stringify(queryResults)}` },
        ];

        const newApiRequestBody = {
          model: 'gpt-3.5-turbo',
          messages: newApiMessages,
        };

        const newResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newApiRequestBody),
        });

        if (!newResponse.ok) {
          throw new Error(`Error: ${newResponse.status} ${newResponse.statusText}`);
        }

        const newData = await newResponse.json();
        const newBotMessage = newData.choices[0].message.content;

        setMessages([
          ...chatMessages,
          {
            message: newBotMessage,
            sender: 'CapitalBot',
          },
        ]);
      } else {
        console.log('La respuesta no incluye código SQL.');
        // Mostrar la respuesta de texto normal
        setMessages([
          ...chatMessages,
          {
            message: botMessage,
            sender: 'CapitalBot',
          },
        ]);
      }
    } catch (error) {
      console.error('Error while processing message:', error);
      setMessages([
        ...chatMessages,
        {
          message: 'Lo siento, no pude procesar tu solicitud en este momento.',
          sender: 'CapitalBot',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="App">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      {currentView === 'chatbot' && (
        <div style={{ height: 'calc(100vh - 60px)', width: '100vw' }}>
          {/* Restamos la altura del header */}
          <MainContainer>
            <ChatContainer>
              <MessageList
                scrollBehavior="smooth"
                typingIndicator={
                  isTyping ? <TypingIndicator content="CapitalBot está escribiendo..." /> : null
                }
              >
                {messages.map((message, i) => (
                  <Message 
                    key={i} 
                    model={{
                      message: message.message,
                      sentTime: message.sentTime,
                      sender: message.sender,
                      direction: message.sender === 'CapitalBot' ? 'incoming' : 'outgoing', // Align messages
                      position: message.sender === 'CapitalBot' ? 'left' : 'right', // Set position based on sender
                    }} 
                  />
                ))}
              </MessageList>
              <MessageInput
                placeholder="Escribe tu mensaje aquí"
                onSend={handleSend}
                attachButton={false}
              />
            </ChatContainer>
          </MainContainer>
        </div>
      )}
      {currentView === 'dashboard' && <Dashboard />}
    </div>
  );
}

export default App;