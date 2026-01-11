from database import SessionLocal
from models import Label

# Create a new database session
db = SessionLocal()

labels = [
    {"name": "bug", "color": "#d32f2f"},
    {"name": "enhancement", "color": "#1976d2"},
    {"name": "documentation", "color": "#388e3c"},
    {"name": "question", "color": "#fbc02d"},
    {"name": "help wanted", "color": "#f57c00"},
    {"name": "urgent", "color": "#c2185b"}
]

# Add labels
for lbl in labels:
    db.add(Label(**lbl))

# Commit changes and close session
db.commit()
db.close()

print("Labels seeded successfully!")
