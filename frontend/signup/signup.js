const form = document.getElementById("signupform");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;

    const user = {
        name,
        email,
        phone,
        password
    };

    try {
        const response = await fetch("http://localhost:3000/users/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Signup failed");
        }

        message.textContent = data.message;
        message.style.color = "green";

        alert(data.message);

        form.reset();

        window.location.href = "../login/login.html";

    } catch (error) {
        console.error("Signup error:", error);

        message.textContent = error.message || "Something went wrong";
        message.style.color = "red";
    }
});