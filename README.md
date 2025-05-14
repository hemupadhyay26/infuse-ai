# 🧠 infuse-ai

**infuse-ai** is a CLI-based Retrieval-Augmented Generation (RAG) system that intelligently scans PDF documents and uses a Large Language Model (LLM) to provide highly relevant, source-backed answers.

> 📚 Ask questions about your documents. Get accurate, contextual, and cited responses — straight from your terminal.

---

## ✨ Features

- 🔍 **PDF-Based Retrieval**: Extracts and indexes content from PDFs
- 🧠 **LLM-Powered Answers**: Uses a large language model to generate contextual responses
- 🧾 **Source-Backed Results**: Each response is linked to the relevant source content
- 🛠️ **CLI Tool**: Simple command-line interface for querying your data
- 🚀 **Modular Architecture**: Built with Node.js for extensibility and future integrations

---

## 📦 Tech Stack

- **Node.js** – Core implementation
- **AWS Bedrock (Claude)** – LLM backend
- **PDF Parser** – To extract textual content from documents
- **Vector Search** – Embedding and similarity matching (planned)

---

## 📁 Supported Input

- PDF documents (more types coming soon: `.txt`, `.csv`, `.docx`, and web links)

---

## 💡 Use Case

- Instantly query research papers, legal documents, manuals, or internal reports
- Extract meaningful insights with traceable sources
- Ideal for developers, researchers, and knowledge workers

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/infuse-ai.git
cd infuse-ai
