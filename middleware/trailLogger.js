const Trail = require("../models/Trail");

const trailLogger = (entity) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;

    // Override the send function to log actions
    res.send = function (body) {
      // Only log successful operations (status codes 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = getAction(req.method);
        let entityId;

        if (req.params.id) {
          entityId = req.params.id;
        } else if (body && body._id) {
          entityId = body._id;
        } else if (body && Array.isArray(body) && body[0] && body[0]._id) {
          entityId = "multiple";
        }

        if (entityId) {
          const trail = new Trail({
            userId: req.user ? req.user._id : undefined,
            action,
            entity,
            entityId,
            details: JSON.stringify({
              method: req.method,
              url: req.originalUrl,
              body: req.body,
            }),
            ip: req.ip,
          });

          trail
            .save()
            .catch((err) => console.error("Trail logging error:", err));
        }
      }

      // Continue with the original send
      return originalSend.call(this, body);
    };

    next();
  };
};

// Helper to determine the action type
const getAction = (method) => {
  switch (method) {
    case "GET":
      return "read";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "other";
  }
};

module.exports = trailLogger;
