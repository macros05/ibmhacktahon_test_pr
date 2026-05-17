import express from 'express';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 8080;
if (require.main === module) {
  app.listen(port, () => console.log(`listening on :${port}`));
}

export default app;
