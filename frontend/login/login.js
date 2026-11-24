
const form = document.getElementById("loginform");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginId = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const user = {
        loginId,
        password
    };

    try {
        const response = await fetch("http://localhost:3000/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        console.log(data);

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        message.textContent = data.message;

        localStorage.setItem("token", data.jwtToken);


        localStorage.setItem("user", JSON.stringify(data.user));

        form.reset();

        alert("Login successfully");


        window.location.href = "../ChatWindow/chat.html";

    } catch (error) {
        console.error("Error:", error);
        message.textContent = "Something went wrong";
    }
});
