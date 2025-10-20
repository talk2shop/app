const mongoose = require("mongoose");
const chalk = require("chalk");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {});
    console.log(chalk.white.bgGreen.bold(" MongoDB Connected "));
  } catch (error) {
    console.error(
      chalk.white.bgRed.bold(" MongoDB Connection Failed: "),
      error
    );
    process.exit(1);
  }
}

module.exports = connectDB;
