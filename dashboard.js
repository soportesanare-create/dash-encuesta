const firebaseConfig = {
  apiKey: "AIzaSyBju6s1bZCNQakcLltJE5jefHf-iWciO5w",
  authDomain: "encuesta-sanare.firebaseapp.com",
  projectId: "encuesta-sanare",
  storageBucket: "encuesta-sanare.firebasestorage.app",
  messagingSenderId: "201767412624",
  appId: "1:201767412624:web:d868b0d8574520b7c2c915"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#resultsTable tbody');
    const totalSurveysEl = document.getElementById('totalSurveys');
    const averageScoreEl = document.getElementById('averageScore');
    const ctx = document.getElementById('questionsChart').getContext('2d');

    try {
        // Cargar datos desde Firebase, ordenados por fecha descendente
        const snapshot = await db.collection("encuestas_resultados")
                                 .orderBy("fecha", "desc")
                                 .get();

        const encuestas = [];
        snapshot.forEach(doc => {
            encuestas.push({ id: doc.id, ...doc.data() });
        });

        if (encuestas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay resultados aún.</td></tr>';
            return;
        }

        let sumQ1 = 0, sumQ2 = 0, sumQ3 = 0, sumQ4 = 0, sumQ5 = 0, sumTotal = 0;

        // Renderizar tabla y acumular valores
        tableBody.innerHTML = '';
        encuestas.forEach(enc => {
            const fecha = enc.fecha ? new Date(enc.fecha.seconds * 1000).toLocaleDateString('es-MX') : 'Reciente';
            
            sumQ1 += enc.q1 || 0;
            sumQ2 += enc.q2 || 0;
            sumQ3 += enc.q3 || 0;
            sumQ4 += enc.q4 || 0;
            sumQ5 += enc.q5 || 0;
            sumTotal += enc.calificacion_final || 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fecha}</td>
                <td><strong>${enc.doctorName || 'Anónimo'}</strong></td>
                <td>${enc.q1 || '-'}</td>
                <td>${enc.q2 || '-'}</td>
                <td>${enc.q3 || '-'}</td>
                <td>${enc.q4 || '-'}</td>
                <td>${enc.q5 || '-'}</td>
                <td><span class="score-badge">${enc.calificacion_final || '-'}</span></td>
            `;
            tableBody.appendChild(tr);
        });

        // Estadísticas generales
        const total = encuestas.length;
        totalSurveysEl.textContent = total;
        
        const avgGlobal = (sumTotal / total).toFixed(1);
        averageScoreEl.innerHTML = `${avgGlobal}<span class="max-score">/10</span>`;

        // Gráfico de promedios por pregunta
        const avgQ1 = (sumQ1 / total).toFixed(2);
        const avgQ2 = (sumQ2 / total).toFixed(2);
        const avgQ3 = (sumQ3 / total).toFixed(2);
        const avgQ4 = (sumQ4 / total).toFixed(2);
        const avgQ5 = (sumQ5 / total).toFixed(2);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['P1: Experiencia', 'P2: Seguridad', 'P3: Comunicación', 'P4: Gestión', 'P5: Valor Comercial'],
                datasets: [{
                    label: 'Promedio de Puntuación (Max 2.0)',
                    data: [avgQ1, avgQ2, avgQ3, avgQ4, avgQ5],
                    backgroundColor: 'rgba(0, 122, 124, 0.7)',
                    borderColor: 'rgba(0, 122, 124, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 2.0
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error al cargar el dashboard: ", error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Error al cargar los datos. Verifique sus reglas de Firebase.</td></tr>';
    }
});
