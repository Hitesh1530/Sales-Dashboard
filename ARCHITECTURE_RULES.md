# Architecture & Code Generation Rules

## 🔒 General Principles

- Use modular structure
- No business logic in routes
- Use service layer for DB calls
- Use controller for request/response
- Use validator layer for Joi schemas

---

## 📁 Backend Folder Rules

src/
 ├── controllers → handle req/res only
 ├── services → DB queries & business logic
 ├── routes → API definitions
 ├── db → connection & config
 ├── validators → Joi schemas
 ├── utils → helpers
 ├── middleware → error handling

Rules:
- Controllers must not contain SQL
- Services must not access req/res
- Routes must stay thin

---

## 📁 Frontend Folder Rules

src/
 ├── components
 │     ├── Charts
 │     ├── Upload
 │     ├── Filters
 ├── pages
 ├── redux
 │     ├── slices
 │     ├── store.js
 ├── api → axios instances
 ├── layout

---

## 📦 Naming Conventions

camelCase → variables  
PascalCase → components  
kebab-case → files  

---

## 🔄 API Integration Rules

- All API calls via Redux thunks
- No direct axios inside components

---

## 🎨 UI Rules

- Use MUI Grid for layout
- All charts responsive
- Show loading skeletons

---

## 🧯 Error Handling Rules

Backend:
- Central error middleware

Frontend:
- Snackbar for errors

---

## 🧪 Testing Rules

- Controllers → integration tested
- Components → render test

---

## ⚡ Performance Rules

- Always paginate large responses
- Never return raw table dumps
