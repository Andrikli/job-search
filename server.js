const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const path = require('path');
// Ініціалізація Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json()); // для обробки JSON у POST-запитах

// Твоя перша тестова точка (endpoint)
app.get("/", (req, res) => {
    res.send("Сервер JobSeeker працює!");
});

const PORT = 5000;
app.delete("/api/applications/:id", async (req, res) => {
    try {
        const appId = req.params.id;
        await db.collection("applications").doc(appId).delete();
        res.json({ message: "Заявку успішно видалено!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
// 1. Отримання всіх заявок користувача (HTTP GET)
app.get("/api/applications/:email", async (req, res) => {
    try {
        const userEmail = req.params.email;
        const snapshot = await db.collection("applications")
            .where("userEmail", "==", userEmail)
            .get();

        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Подача нової заявки з валідацією (HTTP POST)
app.post("/api/apply", async (req, res) => {
    const { userEmail, jobId, jobTitle, company } = req.body;

    try {
        // ВАЛІДАЦІЯ: Перевіряємо, чи є вже така заявка в БД (Завдання 4 вашого варіанта)
        const checkSnapshot = await db.collection("applications")
            .where("userEmail", "==", userEmail)
            .where("jobId", "==", jobId)
            .get();

        if (!checkSnapshot.empty) {
            return res.status(400).json({ message: "Ви вже подавали заявку на цю вакансію!" });
        }

        // Якщо дублікатів немає — зберігаємо
        const newApp = {
            userEmail,
            jobId,
            jobTitle,
            company,
            appliedAt: new Date().toLocaleString('uk-UA')
        };

        await db.collection("applications").add(newApp);
        res.status(201).json({ message: "Заявку успішно подано!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.use(express.static(path.join(__dirname, 'build')));

// Будь-який запит, що не стосується API, повертає React-сайт [cite: 252]
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер працює на порту ${PORT}`);
});