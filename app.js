// Import express framework (used to create server and routes)
const express = require("express");

// Load environment variables from .env file into process.env
require("dotenv").config();

// Import Joi for validation
const Joi = require("joi");

// Create express app instance
const app = express();

// Middleware: Parses incoming JSON requests (req.body)
app.use(express.json());

/**
 * LOGGING MIDDLEWARE (Assignment Requirement #2)
 * Runs for every incoming request
 * Logs method (GET, POST, etc.) and route (/todos)
 */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass control to next middleware/route
});

/**
 * Dummy database (in-memory array)
 * Acts like a temporary database
 */
let todos = [
  { id: 1, task: "Learn Node.js", completed: false },
  { id: 2, task: "Build CRUD API", completed: false },
  { id: 3, task: "Add gitignore file", completed: true },
];

/**
 * JOI VALIDATION SCHEMA (Assignment Requirement #3)
 * Defines rules for creating a todo
 */
const todoSchema = Joi.object({
  task: Joi.string().trim().min(3).required(),
  completed: Joi.boolean().optional(),
}).required();

/**
 * GET ALL TODOS
 * Returns all todos
 */
app.get("/todos", (req, res) => {
  res.status(200).json(todos);
});

/**
 * GET ACTIVE TODOS
 * Filters todos where completed = false
 */
app.get("/todos/active", (req, res) => {
  const activeTodos = todos.filter((t) => !t.completed);
  res.status(200).json(activeTodos);
});

/**
 * GET TODO BY ID
 */
app.get("/todos/:id", (req, res) => {
  const todo = todos.find((t) => t.id === parseInt(req.params.id));

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  res.status(200).json(todo);
});

/**
 * CREATE TODO (POST)
 * Includes:
 * - Joi validation
 * - Try/catch
 */
app.post("/todos", (req, res, next) => {
  try {
    console.log("BODY:", req.body);

    // FORCE validation properly
    const validation = todoSchema.validate(req.body);

    if (validation.error) {
      console.log("VALIDATION FAILED:", validation.error.details[0].message);

      return res.status(400).json({
        error: validation.error.details[0].message,
      });
    }

    console.log("✅ VALIDATION PASSED");

    const newTodo = {
      id: todos.length + 1,
      task: validation.value.task,
      completed: validation.value.completed || false,
    };

    todos.push(newTodo);

    res.status(201).json(newTodo);
  } catch (err) {
    next(err);
  }
});;

/**
 * UPDATE TODO (PATCH)
 * Allows partial updates
 */
app.patch("/todos/:id", (req, res, next) => {
  try {
    const todo = todos.find((t) => t.id === parseInt(req.params.id));

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    /**
     * PATCH VALIDATION (Important fix)
     * Allows updating only one field (task OR completed)
     */
    const updateSchema = Joi.object({
      task: Joi.string().min(3),
      completed: Joi.boolean(),
    }).min(1); // Must send at least one field

     // Validate request body
    const { error, value } = updateSchema.validate(req.body);

    // If validation fails
    if (error) {
      console.log("PATCH VALIDATION ERROR:", error.details[0].message);
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    // Apply & Merge updates into existing todo
    Object.assign(todo, value);

    console.log("✅ PATCH SUCCESS:", todo);

    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE TODO
 */
app.delete("/todos/:id", (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const initialLength = todos.length;

    // Remove todo using filter
    todos = todos.filter((t) => t.id !== id);

    // If nothing was removed
    if (todos.length === initialLength) {
      return res.status(404).json({ error: "Not found" });
    }

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * GLOBAL ERROR HANDLER (Assignment Requirement #4)
 * Catches all errors passed with next(err)
 */
app.use((err, req, res, next) => {
  console.error(err.message); // Log error
  res.status(500).json({ error: "Internal Server Error" });
});

/**
 * PORT CONFIGURATION
 */
const PORT = process.env.PORT || 3000;

/**
 * START SERVER
 */
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
