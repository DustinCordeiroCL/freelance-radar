const DEFAULT_CURRICULUM = `
# Fullstack Developer

## Professional Summary
Senior Fullstack Developer with 6+ years of experience. Skilled in building web applications from frontend to backend, with solid DevOps and cloud infrastructure knowledge.

## Technical Skills

### Frontend
- Angular, ReactJS, Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS

### Backend
- Java with Spring Boot
- Node.js (Express, Fastify)
- PHP with Laravel
- RESTful APIs, GraphQL (basic)

### Databases
- PostgreSQL, MySQL, SQLite, MongoDB

### DevOps & Cloud
- Docker, GCP, Azure, CI/CD

## Domain Experience
- Logistics, Healthcare, HCM (Human Capital Management)

## Ideal Projects
- Web application development (frontend, backend, or fullstack)
- API integrations and third-party service connections
- Administrative dashboards and SaaS products
`;

// Set DEVELOPER_PROFILE env var to override with your personal curriculum
export const CURRICULUM: string = process.env.DEVELOPER_PROFILE ?? DEFAULT_CURRICULUM;
