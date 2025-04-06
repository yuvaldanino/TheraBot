# TheraBot

TheraBot is an AI-powered therapeutic companion that provides personalized emotional support and mental health guidance. It combines the power of AI with therapeutic principles to create a unique, personalized experience for each user.

## Features

- 🔐 Secure user authentication
- 💬 AI-powered therapy chat interface
- 🧠 Session memory and emotional understanding
- 🔔 Smart notifications and check-ins
- 📊 Interactive wellness dashboard
- 🎯 Personal goals tracking
- 🧘‍♂️ Mood reset toolkit

## Tech Stack

### Backend
- Django (Python)
- PostgreSQL
- Celery + Redis
- OpenAI GPT-4
- LangChain
- FAISS

### Frontend
- React
- Tailwind CSS
- Shadcn UI
- Whisper API

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/therabot
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
Create a `.env` file in the frontend directory with:
```
VITE_API_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

## Development

- Backend API runs on http://localhost:8000
- Frontend development server runs on http://localhost:5173
- Celery worker for background tasks
- Redis for caching and message broker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 