// import { Sequelize } from "sequelize";

// const DB_NAME = process.env.DB_NAME || "your_db_name";
// const DB_USER = process.env.DB_USER || "your_db_user";
// const DB_PASSWORD = process.env.DB_PASSWORD || "your_db_password";
// const DB_HOST = process.env.DB_HOST || "localhost";

// // console.log("DB_NAME:", DB_NAME);
// // console.log("DB_USER:", DB_USER);
// // console.log("DB_PASSWORD:", DB_PASSWORD);
// // console.log("DB_HOST:", DB_HOST);

// const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
//   host: DB_HOST, // or your RDS/host IP
//   dialect: "postgres",
//   logging: false,
// });

// const testConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connection has been established successfully.");
//   } catch (error) {
//     console.error("❌ Unable to connect to the database:", error);
//     process.exit(1); // Exit the app if DB connection fails
//   }
// };

// testConnection();

// export default sequelize;
