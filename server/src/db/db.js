import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_FILE = path.join(__dirname, '/katalogwa.sqlite');
const ADMIN_DISPLAY_NAME = 'Owner Byy Motorcycle';

class sqliteDatabase {
    constructor() {
        this.db = new DatabaseSync(SQLITE_FILE);
        this.initTables();
        this.seedInitialData()
    }

    initTables() {
        // Enable Foreign keys
        this.db.exec('PRAGMA foreign_keys = ON;');

        // 1. categories Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Products Table (Relational with Foreign Key to categories)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
            price INTEGER NOT NULL,
            stock_status TEXT NOT NULL DEFAULT 'Tersedia',
            stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
            description TEXT,
            image TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL DEFAULT '',
        customer_notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi'
          CHECK (status IN ('Menunggu Konfirmasi', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan')),
        total INTEGER NOT NULL CHECK (total >= 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        line_total INTEGER NOT NULL CHECK (line_total >= 0)
      );

      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);

    const productColumns = this.db.prepare('PRAGMA table_info(products)').all();
    if (!productColumns.some((column) => column.name === 'stock_quantity')) {
      this.db.exec(`
        ALTER TABLE products
        ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);
        UPDATE products
        SET stock_quantity = CASE WHEN stock_status = 'Tersedia' THEN 1 ELSE 0 END;
      `);
    }

    // 3. Settings Key-Value Table
    this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // 4. Admin Authentication Table
    this.db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Indexes
    this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    `);
}

seedInitialData() {
    // Seed Settings
    const existingSettings = this.db.prepare('SELECT COUNT(*) AS count FROM settings').get();
    if (existingSettings.count === 0) {
        const intertSetting = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        intertSetting.run('storeName', 'Byy Bike');
        intertSetting.run('tagline', 'Solusi Ketika Mau Motor Ganteng');
        intertSetting.run('phone', '6285863674608');
        intertSetting.run('address', 'Jl. Gelora Bung Karno No.5, Jakarta');
        intertSetting.run('currency', 'Rp');
    }

    // Seed Admin
    const existingAdmin = this.db.prepare('SELECT COUNT(*) AS count FROM admins').get();
    if (existingAdmin.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.db.prepare(
        'INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)'
      ).run('admin-1', ADMIN_DISPLAY_NAME, 'admin@katalogwa.com', hashedPassword);
    }

    this.db.prepare('UPDATE admins SET name = ? WHERE name = ?')
      .run(ADMIN_DISPLAY_NAME, 'Owner Toko Berkah');
    this.db.prepare("UPDATE settings SET value = ? WHERE key = 'ownerName' AND value = ?")
      .run(ADMIN_DISPLAY_NAME, 'Owner Toko Berkah');

    const admin = this.db.prepare('SELECT name FROM admins LIMIT 1').get();
    if (admin) {
      this.db.prepare(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
      ).run('ownerName', admin.name);
    }

    // Seed Categories
    const existingCategories = this.db.prepare('SELECT COUNT(*) AS count FROM categories').get();
    if (existingCategories.count === 0) {
      const insertCat = this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
      insertCat.run('cat-1', 'Sparepart Motor', 'sparepart motor');
      insertCat.run('cat-2', 'Ban FDR', 'ban fdr');
      insertCat.run('cat-3', 'Oli', 'oli');
    }

    // Seed Products
    const existingProducts = this.db.prepare('SELECT COUNT(*) AS count FROM products').get();
    if (existingProducts.count === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, category_id, price, stock_status, stock_quantity, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

     const initialProducts = [
    {
        id: "prod-1",
        name: "ECU Juken",
        categoryId: "cat-1",
        price: 10000000,
        stockStatus: "Tersedia",
        description: "Ecu Juken dengan racikan offended",
        image: "-"
    },
    {
        id: "prod-2",
        name: "Roller 9gram Daitona",
        categoryId: "cat-1",
        price: 200000,
        stockStatus: "Tersedia",
        description: "Roller 9gram Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-3",
        name: "Rumah Roler Daitona",
        categoryId: "cat-1",
        price: 200000,
        stockStatus: "Tersedia",
        description: "Rumah Roler Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-4",
        name: "Per Otomatis Daitona",
        categoryId: "cat-1",
        price: 10000,
        stockStatus: "Tersedia",
        description: "Per Otomatis Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-5",
        name: "Kampas Ganda Daitona",
        categoryId: "cat-1",
        price: 200000,
        stockStatus: "Tersedia",
        description: "Kampas Ganda Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-6",
        name: "Mangkok Otomatis Daitona",
        categoryId: "cat-1",
        price: 200000,
        stockStatus: "Tersedia",
        description: "Mangkok Otomatis Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-7",
        name: "V-Belt Daitona",
        categoryId: "cat-1",
        price: 250000,
        stockStatus: "Tersedia",
        description: "V-Belt Daitona cocok untuk menambah speed",
        image: "-"
    },
    {
        id: "prod-8",
        name: "Kaliper Brembo",
        categoryId: "cat-1",
        price: 1000000,
        stockStatus: "Tersedia",
        description: "Kaliper Brembo sangat membantu untuk pengereman anda sekaligus looknya jadi keliatan bagus",
        image: "-"
    },
    {
        id: "prod-9",
        name: "Shock Belakang RCB",
        categoryId: "cat-1",
        price: 500000,
        stockStatus: "Tersedia",
        description: "Shock RCB membantu kenyamanan berkendara anda",
        image: "-"
    }
];

      for (const p of initialProducts) {
        insertProduct.run(
          p.id,
          p.name,
          p.categoryId,
          p.price,
          p.stockStatus,
          p.stockStatus === 'Tersedia' ? 1 : 0,
          p.description,
          p.image
        );
      }
    }
  }

  // --- Settings SQL Operations ---
  getSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  updateSettings(newSettings) {
    const upsert = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, val] of Object.entries(newSettings)) {
      upsert.run(key, String(val));
    }
    return this.getSettings();
  }

  // --- Admin SQL Operations ---
  getAdmin() {
    return this.db.prepare('SELECT id, name, email, password FROM admins LIMIT 1').get();
  }

  updateAdmin(id, { name, email, password }) {
    this.db.prepare(`
      UPDATE admins
      SET name = ?, email = ?, password = ?
      WHERE id = ?
    `).run(name, email, password, id);

    return this.db.prepare('SELECT id, name, email FROM admins WHERE id = ?').get(id);
  }

  // --- Category SQL Operations ---
  getCategories() {
    // Relational SQL query with LEFT JOIN and COUNT
    return this.db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.created_at AS createdAt,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `).all();
  }

  getCategoryById(id) {
    return this.db.prepare('SELECT id, name, slug FROM categories WHERE id = ?').get(id);
  }

  addCategory(name) {
    const id = `cat-${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
    return { id, name, slug, productCount: 0 };
  }

  updateCategory(id, name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = this.db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, slug, id);
    if (res.changes === 0) return null;
    return { id, name, slug };
  }

  deleteCategory(id) {
    const res = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Product SQL Operations ---
  getProducts(filters = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.stock_quantity AS stockQuantity,
        p.description, 
        p.image, 
        p.image AS imageUrl,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters.stockStatus) {
      sql += ' AND p.stock_status = ?';
      params.push(filters.stockStatus);
    }

    if (filters.search) {
      sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)';
      const queryPattern = `%${filters.search.toLowerCase()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += ' ORDER BY p.created_at DESC';

    return this.db.prepare(sql).all(...params);
  }

  getProductById(id) {
    return this.db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.stock_quantity AS stockQuantity,
        p.description, 
        p.image, 
        p.image AS imageUrl,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  addProduct(productData) {
    const id = `prod-${Date.now()}`;
    const price = Number(productData.price) || 0;
    const stockQuantity = productData.stockQuantity !== undefined
      ? Number(productData.stockQuantity)
      : 1;
    const stockStatus = productData.stockStatus || 'Tersedia';
    const description = productData.description || '';
    const image = productData.image || '-';

    this.db.prepare(`
      INSERT INTO products (id, name, category_id, price, stock_status, stock_quantity, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, productData.name, productData.categoryId, price, stockStatus, stockQuantity, description, image);

    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const current = this.getProductById(id);
    if (!current) return null;

    const name = productData.name !== undefined ? productData.name : current.name;
    const categoryId = productData.categoryId !== undefined ? productData.categoryId : current.categoryId;
    const price = productData.price !== undefined ? Number(productData.price) : current.price;
    const stockQuantity = productData.stockQuantity !== undefined
      ? Number(productData.stockQuantity)
      : current.stockQuantity;
    const stockStatus = productData.stockStatus !== undefined ? productData.stockStatus : current.stockStatus;
    const description = productData.description !== undefined ? productData.description : current.description;
    const image = productData.image !== undefined ? productData.image : current.image;

    this.db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, stock_status = ?, stock_quantity = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, categoryId, price, stockStatus, stockQuantity, description, image, id);

    return this.getProductById(id);
  }

  toggleStock(id) {
    const product = this.getProductById(id);
    if (!product) return null;

    const newStock = product.stockStatus === 'Tersedia' ? 'Habis' : 'Tersedia';
    this.db.prepare(`
      UPDATE products 
      SET stock_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStock, id);

    return this.getProductById(id);
  }

  deleteProduct(id) {
    const res = this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.changes > 0;
  }

  getProductImageUsageCount(image) {
    return this.db.prepare('SELECT COUNT(*) AS count FROM products WHERE image = ?').get(image).count;
  }

  getOrders() {
    const orders = this.db.prepare(`
      SELECT
        id,
        customer_name AS customerName,
        customer_phone AS customerPhone,
        customer_notes AS customerNotes,
        status,
        total,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      ORDER BY created_at DESC, rowid DESC
    `).all();
    const items = this.db.prepare(`
      SELECT
        order_id AS orderId,
        product_id AS productId,
        product_name AS productName,
        quantity,
        unit_price AS unitPrice,
        line_total AS lineTotal
      FROM order_items
      ORDER BY id
    `).all();
    const itemsByOrder = new Map();
    for (const item of items) {
      const orderItems = itemsByOrder.get(item.orderId) || [];
      orderItems.push(item);
      itemsByOrder.set(item.orderId, orderItems);
    }

    return orders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) || [],
    }));
  }

  getOrderById(id) {
    const order = this.db.prepare(`
      SELECT
        id,
        customer_name AS customerName,
        customer_phone AS customerPhone,
        customer_notes AS customerNotes,
        status,
        total,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      WHERE id = ?
    `).get(id);
    if (!order) return null;

    order.items = this.db.prepare(`
      SELECT
        order_id AS orderId,
        product_id AS productId,
        product_name AS productName,
        quantity,
        unit_price AS unitPrice,
        line_total AS lineTotal
      FROM order_items
      WHERE order_id = ?
      ORDER BY id
    `).all(id);
    return order;
  }

  createOrder({ customerName, customerPhone, customerNotes, items }) {
    const id = `order-${randomUUID()}`;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const getProduct = this.db.prepare(`
        SELECT id, name, price, stock_status AS stockStatus
        FROM products
        WHERE id = ?
      `);
      const orderItems = items.map(({ productId, quantity }) => {
        const product = getProduct.get(productId);
        if (!product) {
          throw Object.assign(new Error('Salah satu produk tidak ditemukan'), {
            code: 'ORDER_PRODUCT_NOT_FOUND',
          });
        }
        if (product.stockStatus !== 'Tersedia') {
          throw Object.assign(new Error(`Produk "${product.name}" sedang habis`), {
            code: 'ORDER_PRODUCT_UNAVAILABLE',
          });
        }
        const lineTotal = product.price * quantity;
        if (!Number.isSafeInteger(lineTotal)) {
          throw Object.assign(new Error('Total pesanan melebihi batas yang didukung'), {
            code: 'ORDER_TOTAL_INVALID',
          });
        }
        return {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          lineTotal,
        };
      });
      const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(total)) {
        throw Object.assign(new Error('Total pesanan melebihi batas yang didukung'), {
          code: 'ORDER_TOTAL_INVALID',
        });
      }

      this.db.prepare(`
        INSERT INTO orders (id, customer_name, customer_phone, customer_notes, total)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, customerName, customerPhone, customerNotes, total);

      const insertItem = this.db.prepare(`
        INSERT INTO order_items
          (order_id, product_id, product_name, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const item of orderItems) {
        insertItem.run(
          id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        );
      }

      this.db.exec('COMMIT');
      return this.getOrderById(id);
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  updateOrderStatus(id, status) {
    const result = this.db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);
    return result.changes ? this.getOrderById(id) : null;
  }

  deleteOrder(id) {
    const result = this.db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const db = new sqliteDatabase();
