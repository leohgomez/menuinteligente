import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  app.use(express.json());

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // In-memory state
  let products = [];
  let tables = [];
  let kitchenOrders = [];

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state to the newly connected client
    socket.emit('initialState', { products, tables, kitchenOrders });

    socket.on('updateProducts', (newProducts) => {
      products = newProducts;
      io.emit('productsUpdated', products);
    });

    socket.on('updateTables', (newTables) => {
      tables = newTables;
      io.emit('tablesUpdated', tables);
    });

    socket.on('sendToKitchen', (order) => {
      kitchenOrders.push(order);
      io.emit('kitchenOrdersUpdated', kitchenOrders);
    });

    socket.on('markOrderReady', (orderId) => {
      const orderIndex = kitchenOrders.findIndex((o) => o.id === orderId);
      if (orderIndex !== -1) {
        kitchenOrders[orderIndex].status = 'ready';
        io.emit('kitchenOrdersUpdated', kitchenOrders);
        io.emit('orderReadyNotification', kitchenOrders[orderIndex]);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
