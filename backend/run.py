import os

# Limit TensorFlow CPU memory footprint and thread pools to prevent container OOM crashes
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    # Enable reload only in local development (when not in production/deployment environments)
    is_production = (
        os.getenv("SPACE_ID") is not None or
        os.getenv("RAILWAY_ENVIRONMENT") is not None or
        os.getenv("ENVIRONMENT") == "production"
    )
    reload = not is_production
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload)
