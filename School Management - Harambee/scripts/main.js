import { auth, db } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Helper to display feedback messages below forms
function showStatus(form, message, isError = false) {
    let statusBox = form.querySelector(".firebase-status");
    if (!statusBox) {
        statusBox = document.createElement("div");
        statusBox.className = "firebase-status";
        form.appendChild(statusBox);
    }
    statusBox.textContent = message;
    statusBox.className = `firebase-status ${isError ? "error" : "success"}`;
}

document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // 1. RESPONSIVE SIDE MENU DRAWER
    // =========================================
    const menuBtn = document.querySelector(".menu-btn");
    const navBar = document.querySelector(".nav-bar");

    if (menuBtn && navBar) {
        menuBtn.addEventListener("click", () => {
            const isOpen = navBar.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", String(isOpen));
            menuBtn.textContent = isOpen ? "✕ CLOSE" : "☰ MENU";
        });
    }

    // =========================================
    // 2. AUTHENTICATION STATE OBSERVER
    // =========================================
    const navList = document.querySelector(".nav-bar ul");
    onAuthStateChanged(auth, (user) => {
        if (!navList) return;
        const loginLink = navList.querySelector('a[href="login.html"]');

        if (user && loginLink) {
            loginLink.textContent = "Logout";
            loginLink.href = "#";
            loginLink.addEventListener("click", async (e) => {
                e.preventDefault();
                await signOut(auth);
                window.location.href = "login.html";
            });
        }
    });

    // =========================================
    // 3. STUDENT LOGIN (login.html)
    // =========================================
    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const studentNumber = document.getElementById("student-number").value.trim();
            const password = document.getElementById("password").value;

            // Convert student number (e.g., ADM1024) into an email format for Firebase Auth
            const studentEmail = studentNumber.includes("@")
                ? studentNumber
                : `${studentNumber.toLowerCase()}@students.harambeeprimary.ac.ke`;

            try {
                await signInWithEmailAndPassword(auth, studentEmail, password);
                showStatus(loginForm, "Login successful! Redirecting to dashboard...");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1200);
            } catch (error) {
                if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
                    showStatus(loginForm, "Invalid student number or password.", true);
                } else {
                    showStatus(loginForm, `Authentication error: ${error.message}`, true);
                }
            }
        });
    }

    // =========================================
    // 4. CONTACT INQUIRIES -> FIRESTORE (contact.html)
    // =========================================
    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                fullName: document.getElementById("full-name").value.trim(),
                email: document.getElementById("email-address").value.trim(),
                phone: document.getElementById("tel-number").value.trim(),
                message: document.getElementById("message").value.trim(),
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "inquiries"), payload);
                showStatus(contactForm, "Thank you! Your inquiry has been saved and sent to the school office.");
                contactForm.reset();
            } catch (error) {
                showStatus(contactForm, `Could not send message: ${error.message}`, true);
            }
        });
    }

    // =========================================
    // 5. FEE PAYMENTS -> FIRESTORE (finances.html)
    // =========================================
    const paymentForm = document.getElementById("payment-form");
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const method = document.getElementById("payment").value;
            const currentUser = auth.currentUser;

            if (!currentUser) {
                showStatus(paymentForm, "Please log in to the Student Portal first to record a fee payment.", true);
                return;
            }

            try {
                await addDoc(collection(db, "fee_payments"), {
                    studentUid: currentUser.uid,
                    studentEmail: currentUser.email,
                    paymentMethod: method,
                    status: "Initiated",
                    createdAt: serverTimestamp()
                });
                showStatus(paymentForm, `Payment request via ${method} logged! Check your phone/bank prompt to complete.`);
            } catch (error) {
                showStatus(paymentForm, `Payment error: ${error.message}`, true);
            }
        });
    }

    // =========================================
    // 6. ACADEMIC RESULTS LOOKUP (index.html)
    // =========================================
    const resultsForm = document.querySelector(".results-form");
    if (resultsForm) {
        resultsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const term = document.getElementById("results").value;
            const currentUser = auth.currentUser;

            if (!currentUser) {
                showStatus(resultsForm, "Please log in to view your term results.", true);
                return;
            }

            try {
                const q = query(
                    collection(db, "results"),
                    where("studentUid", "==", currentUser.uid),
                    where("term", "==", term)
                );
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    showStatus(resultsForm, `No published results found yet for ${term}.`, true);
                } else {
                    const data = snapshot.docs[0].data();
                    showStatus(resultsForm, `${term} Average Score: ${data.average}% — Grade: ${data.grade}`);
                }
            } catch (error) {
                showStatus(resultsForm, `Error fetching results: ${error.message}`, true);
            }
        });
    }
});
