const $ = (select) => document.querySelector(select);

document.addEventListener("DOMContentLoaded", function (event) {
  const registerForm = document.querySelector("form");
  const registerFormContainer = $("#register-form-container");
  const waitingScreenContainer = $("#waiting-screen-container");
  const resendLinkButton = $("#resend-link");
  const editEmailButton = $("#edit-email");
  const usernameInput = $("#username");
  const emailInput = $("#email");
  const passwordInput = $("#password");
  const confirmPasswordInput = $("#confirm-password");

  let formData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  };

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (password !== confirmPassword) {
        alert("As senhas não coincidem.");
        confirmPasswordInput.focus();
        return;
      }

      formData.username = usernameInput.value;
      formData.email = emailInput.value;
      formData.password = passwordInput.value;
      formData.confirmPassword = confirmPasswordInput.value;
      formData.terms = $("#terms").checked;

      await sendRegister(formData.username, formData.email, formData.password);
    });
  }

  if (resendLinkButton) {
    resendLinkButton.addEventListener("click", async (e) => {
      e.preventDefault();
      if (formData.email) {
        await resendVerificationLink(formData.email);
      } else {
        alert("Não foi possível reenviar o link. E-mail não encontrado.");
      }
    });
  }

  if (editEmailButton) {
    editEmailButton.addEventListener("click", (e) => {
      e.preventDefault();
      hideWaitingScreen();
      fillFormWithSavedData();
      emailInput.focus();
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

  window.showWaitingScreen = () => {
    if (registerFormContainer && waitingScreenContainer) {
      registerFormContainer.classList.add("d-none");
      waitingScreenContainer.classList.remove("d-none");
    }
  };

  window.hideWaitingScreen = () => {
    if (registerFormContainer && waitingScreenContainer) {
      waitingScreenContainer.classList.add("d-none");
      registerFormContainer.classList.remove("d-none");
    }
  };

  const fillFormWithSavedData = () => {
    usernameInput.value = formData.username;
    emailInput.value = formData.email;
    passwordInput.value = formData.password;
    confirmPasswordInput.value = formData.confirmPassword;
    $("#terms").checked = formData.terms;
  };
});

const sendRegister = async (username, email, password) => {
  const response = await fetch("/register", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      useremail: email,
      userpassword: password,
    }),
  });

  if (response.ok) {
    window.showWaitingScreen();
  } else {
    alert("Erro ao cadastrar. Tente novamente.");
  }
};

const resendVerificationLink = async (email) => {
  try {
    const response = await fetch("/resend-verification/" + email);

    if (response.ok) {
      alert("Novo link de verificação enviado! Verifique seu e-mail.");
    } else {
      alert("Erro ao reenviar o link. Tente novamente mais tarde.");
    }
  } catch (error) {
    console.error("Erro ao reenviar link:", error);
    alert("Ocorreu um erro ao reenviar o link. Por favor, tente novamente.");
  }
};
