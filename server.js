const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sua_chave_secreta_para_recrutadores_verem';

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Banco de Dados em Memória (Mock)
const tenants = {
  'loja-geek': { id: 1, name: 'Loja Geek Oficial', plan: 'Premium' },
  'sports-wear': { id: 2, name: 'Sports Wear Store', plan: 'Basic' }
};

const products = [
  { id: 1, tenantId: 1, name: 'Camiseta Dev Full Stack', price: 89.90, stock: 15 },
  { id: 2, tenantId: 1, name: 'Caneca Café && Code', price: 45.00, stock: 40 },
  { id: 3, tenantId: 2, name: 'Tênis de Corrida Ultra', price: 349.99, stock: 8 }
];

const users = []; // Cadastro dinâmico via API

// Middleware Multitenant: Identifica a loja pelo Header da requisição
const tenantContext = (req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'];
  if (!tenantSlug || !tenants[tenantSlug]) {
    return res.status(404).json({ error: 'Inquilino (Tenant) não encontrado ou cabeçalho ausente.' });
  }
  req.tenant = tenants[tenantSlug];
  next();
};

// Middleware de Autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// --- ROTAS DA API ---

// 1. Catálogo Público (Filtra produtos pelo Tenant ativo)
app.get('/api/products', tenantContext, (req, res) => {
  const tenantProducts = products.filter(p => p.tenantId === req.tenant.id);
  res.json({
    tenant: req.tenant.name,
    plan: req.tenant.plan,
    products: tenantProducts
  });
});

// 2. Registro de Usuários
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, name, email, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUser.id });
  } catch {
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

// 3. Login com Geração de JWT
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ message: 'Autenticado com sucesso', token });
});

// 4. Checkout Simulado (Integração de Pagamento Stripe)
app.post('/api/checkout', tenantContext, authenticateToken, (req, res) => {
  const { items, paymentMethodId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'O carrinho está vazio.' });
  }

  // Calcula o total com base nos produtos do Tenant
  let totalAmount = 0;
  for (const item of items) {
    const product = products.find(p => p.id === item.productId && p.tenantId === req.tenant.id);
    if (!product) return res.status(400).json({ error: `Produto ID ${item.productId} inválido nesta loja.` });
    totalAmount += product.price * item.quantity;
  }

  // Simulação de resposta do Gateway Stripe
  res.status(200).json({
    success: true,
    message: 'Pagamento processado via Stripe com sucesso!',
    transaction: {
      id: `ch_${Math.random().toString(36).substr(2, 9)}`,
      amount: totalAmount.toFixed(2),
      currency: 'BRL',
      tenantId: req.tenant.id,
      customerEmail: req.user.email,
      status: 'succeeded'
    }
  });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Multitenant rodando na porta ${PORT}`);
});