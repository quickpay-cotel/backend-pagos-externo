import * as dotenv from 'dotenv';
dotenv.config();
// Configuración de la base de datos
export const databaseConfig = {
  user: process.env.DB_USER,         // Reemplaza con tu usuario de PostgreSQL
  host: process.env.DB_HOST,           // Dirección del servidor de PostgreSQL
  database: process.env.DB_NAME,     // Nombre de tu base de datos
  password: process.env.DB_PASSWORD,   // Contraseña de tu usuario
  port: Number(process.env.DB_PORT),                    // Puerto de PostgreSQL
};