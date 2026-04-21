const errorHandler = (err, req, res, next) => {
    // Default values
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    // Send JSON response
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        data: err.data || null,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

export default errorHandler;