import nodemailer from "nodemailer";

const htmlCodeVerify = (token) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Link de confirmação</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
          "Segoe UI Symbol";
        line-height: 1.6;
        color: #333333;
        background-color: #f8f8f8;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid #e0e0e0;
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eeeeee;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #007bff;
        font-size: 28px;
        margin: 0;
      }
      .content {
        text-align: center;
        margin-bottom: 30px;
      }
      .content p {
        font-size: 16px;
        margin-bottom: 15px;
      }
      .code-box {
        background-color: #e9ecef;
        padding: 15px 25px;
        border-radius: 5px;
        display: inline-block;
        margin: 20px auto;
      }
      .code-box strong {
        font-size: 28px;
        color: #007bff;
        letter-spacing: 3px;
      }
      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
        font-size: 14px;
        color: #888888;
        margin-top: 30px;
      }
      .footer a {
        color: #007bff;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Confirmação de Email</h1>
      </div>
      <div class="content">
        <p>Falta pouco para o registro</p>
        <p>
          Recebemos uma solicitação de confirmação de email, para sua conta,
          clique no link para prosseguir:
        </p>
        <div class="code-box">
          <a href="http://stream-server-vava.onrender.com:1090/verify-code?${token}"
            >link de confirmação</a
          >
        </div>
        <p>
          Este link esta válido por 5 minutos. Caso você não solicitou este
          link, ignore este e-mail.
        </p>
      </div>
      <div class="footer">
        <p>Atenciosamente,<br />Vava dev</p>
        <p>
          <a href="mailto:gm2373cntofc@gmail.com">Contato</a> |
          <a href="http://localhost:1090/index.html">Nosso Site</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: "587",
  secure: false,
  auth: {
    user: "valdirdesouzajunioradm@gmail.com",
    pass: "zcvqeklrigbyjqwc",
  },
});
transporter
  .sendMail({
    from: "Vavazin dev <valdirdesouzajunioradm@gmail.com>",
    to: "valdirdesouzajunior@gmail.com",
    subject: "Link de verificação",
    text: "Para prosseguir com o seu cadastro:",
    html: htmlCodeVerify(),
  })
  .then(() => console.log("sucesso!!"))
  .catch((r) => console.log(r));
