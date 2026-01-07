import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
console.log('Using VERIFY_TOKEN:', VERIFY_TOKEN);
console.log('Using PHONE_NUMBER_ID:', PHONE_NUMBER_ID);
console.log("WHATSAPP_TOKEN",WHATSAPP_TOKEN)

// Webhook verification endpoint
app.get('/webhook', (req: Request, res: Response) => {
  console.log("Received webhook verification request:", req.query);
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook endpoint to receive messages
app.post('/webhook', async (req: Request, res: Response) => {
  console.log("🔥 WEBHOOK HIT 🔥");
  
  try {
    const body = req.body;
console.log("bodey:", body);
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach((entry: any) => {
        const changes = entry.changes;
        changes.forEach((change: any) => {
          if (change.field === 'messages') {
            const value = change.value;
            
            if (value.messages) {
              value.messages.forEach(async (message: any) => {
                const from = message.from;
                const messageId = message.id;
                
                console.log(`Received message from ${from}: ${message.text?.body}`);
                
                // Send "hi" response
                await sendMessage(from, 'hi');
              });
            }
          }
        });
      });
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Function to send a message
async function sendMessage(to: string, message: string) {
  console.log(`Sending message to ${to}: ${message}`);
  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Message sent successfully:', response.data);
  } catch (error: any) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
