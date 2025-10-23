# 📑 Project Index

Welcome to the Hotjar-like Analytics Tracking System! This index helps you navigate the project.

## 🚀 Quick Start (Pick One)

| I want to... | Go to... |
|-------------|----------|
| Get started in 5 minutes | [QUICKSTART.md](QUICKSTART.md) |
| Read full documentation | [README.md](README.md) |
| See code examples | [EXAMPLES.md](EXAMPLES.md) |
| Understand the architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| View all project files | [FILE_STRUCTURE.md](FILE_STRUCTURE.md) |
| Get project overview | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |

## 📚 Documentation Files

### 1. [QUICKSTART.md](QUICKSTART.md) - 5 Minute Setup
**Best for**: Getting started immediately

**Contents**:
- Prerequisites
- Installation steps
- Running the demo
- Basic integration
- Troubleshooting

**Time to read**: 5 minutes

---

### 2. [README.md](README.md) - Complete Documentation
**Best for**: Comprehensive understanding

**Contents**:
- Features overview
- Installation guide
- Client integration
- Event types
- Privacy features
- Backend API
- Database setup
- Configuration options
- Production checklist

**Time to read**: 20 minutes

---

### 3. [EXAMPLES.md](EXAMPLES.md) - Code Examples
**Best for**: Learning by example

**Contents**:
- HTML integration
- React integration
- Vue.js integration
- GDPR compliance
- E-commerce tracking
- Form tracking
- SPA route tracking
- TypeScript usage
- PostgreSQL integration
- ClickHouse integration
- Rate limiting
- Testing examples

**Time to read**: 15 minutes

---

### 4. [ARCHITECTURE.md](ARCHITECTURE.md) - System Design
**Best for**: Understanding internals

**Contents**:
- Architecture diagram
- Component details
- Data flow
- Event types
- Privacy & security
- Performance optimizations
- Scalability
- Extensibility

**Time to read**: 30 minutes

---

### 5. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview
**Best for**: Getting a high-level view

**Contents**:
- What was built
- Key features
- Quick usage guide
- Event types table
- Privacy summary
- Performance metrics
- Production checklist

**Time to read**: 10 minutes

---

### 6. [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - File Organization
**Best for**: Navigating the codebase

**Contents**:
- Complete file tree
- File descriptions
- Code statistics
- Build process
- Import structure
- Entry points

**Time to read**: 5 minutes

---

## 🗂️ Source Code Organization

### Client SDK (`src/`)
```
src/
├── loader/index.ts        ← Async loader (2KB)
├── sdk/
│   ├── index.ts          ← SDK entry point
│   └── tracker.ts        ← Core tracking logic
├── types/index.ts        ← TypeScript definitions
└── utils/
    ├── session.ts        ← Session management
    ├── privacy.ts        ← Masking & PII scrubbing
    └── transport.ts      ← Batching & sending
```

**Read**: Start with `tracker.ts` to understand core logic

### Backend (`backend/`)
```
backend/
├── server.ts             ← Express API server
├── validation.ts         ← Zod schemas
└── pii-scrubber.ts       ← Server-side PII removal
```

**Read**: Start with `server.ts` to understand API

### Demo (`demo/`)
```
demo/
└── index.html            ← Interactive demo application
```

**Run**: `npm run dev:demo` after building

---

## 🎯 Common Tasks

### Setup & Installation
```bash
# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh

# Or manually
npm install
npm run build
```

**Documentation**: [QUICKSTART.md](QUICKSTART.md)

---

### Running the Demo
```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:demo

# Open http://localhost:3000
```

**Documentation**: [QUICKSTART.md](QUICKSTART.md) → "Quick Test"

---

### Integrating into Your Site
```html
<script
  async
  src="/loader.min.js"
  data-site-id="your-site-id"
  data-endpoint="/v1/ingest"
  data-sdk-url="/sdk.min.js"
></script>
```

**Documentation**: [README.md](README.md) → "Client-Side Integration"

---

### Tracking Custom Events
```javascript
hj('track', 'event_name', { property: 'value' });
```

**Documentation**: [EXAMPLES.md](EXAMPLES.md) → "Client Integration Examples"

---

### Setting Up Database
**PostgreSQL**: [README.md](README.md) → "Database Storage"

**ClickHouse**: [EXAMPLES.md](EXAMPLES.md) → "ClickHouse Integration"

---

### Configuring Privacy
```javascript
hj('config', {
  maskSelectors: ['.sensitive'],
  consent: userAccepted,
  sampleRate: 0.5
});
```

**Documentation**: [README.md](README.md) → "Privacy & Security"

---

## 🔍 Finding Specific Information

### Features

| Feature | Documentation |
|---------|--------------|
| Event tracking | [README.md](README.md) → "Event Types" |
| Privacy features | [README.md](README.md) → "Privacy & Security" |
| Session management | [ARCHITECTURE.md](ARCHITECTURE.md) → "Session Management" |
| Batching | [ARCHITECTURE.md](ARCHITECTURE.md) → "Event Batching" |
| GDPR compliance | [EXAMPLES.md](EXAMPLES.md) → "GDPR Consent Management" |
| Performance | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) → "Performance" |

### Integration

| Platform | Documentation |
|----------|--------------|
| HTML | [EXAMPLES.md](EXAMPLES.md) → "Basic HTML Integration" |
| React | [EXAMPLES.md](EXAMPLES.md) → "React Integration" |
| Vue.js | [EXAMPLES.md](EXAMPLES.md) → "Vue.js Integration" |
| TypeScript | [EXAMPLES.md](EXAMPLES.md) → "TypeScript Usage" |

### Backend

| Topic | Documentation |
|-------|--------------|
| API endpoint | [README.md](README.md) → "Backend API" |
| Database setup | [README.md](README.md) → "Database Storage" |
| Validation | [ARCHITECTURE.md](ARCHITECTURE.md) → "Validation" |
| PII scrubbing | [ARCHITECTURE.md](ARCHITECTURE.md) → "Server-Side Security" |

### Production

| Task | Documentation |
|------|--------------|
| Deployment | [README.md](README.md) → "Production Checklist" |
| Authentication | [EXAMPLES.md](EXAMPLES.md) → "Rate Limiting & Authentication" |
| Monitoring | [ARCHITECTURE.md](ARCHITECTURE.md) → "Monitoring & Observability" |
| Scaling | [ARCHITECTURE.md](ARCHITECTURE.md) → "Scalability" |

---

## 🎓 Learning Path

### Beginner (I'm new to this)
1. Read [QUICKSTART.md](QUICKSTART.md)
2. Run the demo
3. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
4. Try basic integration from [README.md](README.md)

**Time**: 30 minutes

---

### Intermediate (I want to integrate)
1. Read [README.md](README.md)
2. Review [EXAMPLES.md](EXAMPLES.md) for your framework
3. Set up your database from examples
4. Test integration locally

**Time**: 2 hours

---

### Advanced (I want to customize)
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review source code in `src/`
3. Understand data flow
4. Modify tracking logic
5. Deploy to production

**Time**: 1 day

---

## 📞 Quick Reference

### Commands

```bash
# Setup
npm install                # Install dependencies
npm run build             # Build SDK

# Development
npm run dev               # Run everything
npm run dev:backend       # Backend only
npm run dev:demo          # Demo only

# Build
npm run build:sdk         # Build SDK only
npm run build:loader      # Build loader only
```

### Files to Edit

| Task | File |
|------|------|
| Add event type | `src/types/index.ts` |
| Modify tracking | `src/sdk/tracker.ts` |
| Change privacy rules | `src/utils/privacy.ts` |
| Update API | `backend/server.ts` |
| Change validation | `backend/validation.ts` |
| Modify demo | `demo/index.html` |

### API Reference

```javascript
// Track custom event
hj('track', eventName, properties)

// Identify user
hj('identify', userId, traits)

// Manage consent
hj('consent', granted)

// Update config
hj('config', options)
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| SDK not loading | Check `data-site-id` attribute |
| Events not sending | Verify backend is running |
| Build fails | Delete `node_modules`, run `npm install` |
| Demo won't start | Check ports 3000, 3001 are free |
| TypeScript errors | Run `npm run build` to regenerate types |

**Full guide**: [QUICKSTART.md](QUICKSTART.md) → "Troubleshooting"

---

## 📊 Project Statistics

- **Total files**: 35+
- **Source code**: ~1,500 lines
- **Documentation**: ~2,500 lines
- **Build output**: 37KB (gzipped)
- **Event types**: 9 built-in
- **Dependencies**: 4 runtime, 10 dev

---

## 🌟 Key Features Checklist

- ✅ Async loading (2KB)
- ✅ Auto event tracking
- ✅ Session management
- ✅ Privacy features
- ✅ GDPR compliance
- ✅ Event batching
- ✅ Gzip compression
- ✅ Backend API
- ✅ Validation
- ✅ PII scrubbing
- ✅ TypeScript
- ✅ Demo app
- ✅ Comprehensive docs

---

## 📝 Next Steps

1. ✅ **Read** [QUICKSTART.md](QUICKSTART.md) (5 min)
2. ✅ **Run** the demo (10 min)
3. ✅ **Review** [EXAMPLES.md](EXAMPLES.md) for your stack (15 min)
4. ✅ **Integrate** into your site (1 hour)
5. ✅ **Deploy** backend (varies)
6. ✅ **Build** analytics dashboard (future)

---

## 📮 Project Links

- **Main docs**: [README.md](README.md)
- **Quick start**: [QUICKSTART.md](QUICKSTART.md)
- **Examples**: [EXAMPLES.md](EXAMPLES.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Summary**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Files**: [FILE_STRUCTURE.md](FILE_STRUCTURE.md)

---

## 🎉 You're All Set!

Pick a documentation file above based on what you need, or run:

```bash
# Windows
setup.bat

# Mac/Linux
./setup.sh
```

Happy tracking! 🚀