const $ = (select) => document.querySelector(select);

document.addEventListener("DOMContentLoaded", async function (event) {
  const registerForm = document.querySelector("form");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const password = document.getElementById("password");

      await login();
    });
  }

  const animateOnScroll = function () {
    const elements = document.querySelectorAll(".animate__animated");

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;

      if (elementPosition < screenPosition) {
        element.classList.add("animate__fadeInUp");
      }
    });
  };

  window.addEventListener("scroll", animateOnScroll);
  animateOnScroll();
});

const login = async () => {
  const email = $("#email").value;
  const password = $("#password").value; // Usando a senha confirmada
  const response = await fetch("/users/login", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      useremail: email,
      userpassword: password,
    }),
  }).then((r) => r);

  if (response.ok) {
    $("#email").value = "";
    $("#password").value = "";

    window.location.href = "/";
  } else {
    alert("Erro ao cadastrar. Tente novamente.");
  }
};
