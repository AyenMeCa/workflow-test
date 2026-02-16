# Sententia Back

Backend de Sententia basado en FastAPI con integracion a Pinecone.

## Objetivos de arquitectura

- Escalable por capas: `api`, `services`, `schemas`, `core`.
- Configuracion centralizada por variables de entorno.
- Cliente Pinecone encapsulado para desacoplar infraestructura del API.
- Codigo simple de mantener (bus factor): estructura explicita, pruebas base y documentacion operativa.

## Requisitos

- Python 3.11+
- Docker Desktop (opcional, para ejecucion en contenedor)

## Variables de entorno

Se incluye `.env` y `.env.example` con las variables minimas.

Variables clave:

- `PINECONE_API_KEY`
- `PINECONE_ASSISTANT_NAME`
- `PINECONE_ASSISTANT_MODEL`
- `PINECONE_ASSISTANT_REGION` (`us` o `eu`)

## Ejecutar en local (sin Docker)

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Ejecutar con Docker

### Build y arranque

```bash
docker compose up --build -d
```

### Ver logs

```bash
docker compose logs -f api
```

### Detener

```bash
docker compose down
```

El API quedara disponible en `http://localhost:8000`.

## Endpoints iniciales

- `GET /api/v1/health`
- `POST /api/v1/assistant/ensure`
- `GET /api/v1/assistant/status`
- `GET /api/v1/assistant/files`
- `POST /api/v1/assistant/chat`

## Pruebas

```bash
pytest
```

## Convenciones para mantener escalabilidad

- Nuevos casos de uso van en `services/`.
- Nuevos contratos de entrada/salida van en `schemas/`.
- Rutas livianas: solo validacion y orquestacion.
- Configuracion y recursos compartidos en `core/`.
