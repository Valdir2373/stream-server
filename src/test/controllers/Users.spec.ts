let idUser = "";
let emailUser = "";

const user = {
  username: "valdir#316",
  useremail: "vaaaa@gmail.com",
  userpassword: "123128",
};

describe("Aqui está, todos os testes, de controllers: ", () => {
  it("Tentando registrar um usuario: ", async () => {
    const response = await fetch("http://localhost:8080/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(user),
    }).then((r) => r);

    const responseJson: any = await response.json();

    console.log(responseJson);

    expect(response.status).toBe(201);
    expect(typeof responseJson.id).toBe("string");
    emailUser = user.useremail;
    idUser = responseJson.id;
  });

  it("deve pegar, todos os usuarios: ", async () => {
    const todosOsUsuarios = await fetch("http://localhost:8080/users").then(
      (r) => r.json()
    );
    expect(todosOsUsuarios).toBeDefined();
    expect(Array.isArray(todosOsUsuarios)).toBe(true);
  });

  it("Deve pegar, um usuario, pela id: ", async () => {
    // console.log(idUser);

    const responseJson = await fetch(
      "http://localhost:8080/users/id/" + idUser
    ).then((r) => r.json());
    // console.log(responseJson);

    expect(responseJson).toBeDefined();
  });

  it("deve pegar, um usuario, pelo email: ", async () => {
    const responseJson = await fetch(
      "http://localhost:8080/users/email/" + emailUser
    ).then((r) => r.json());
    expect(responseJson).toBeDefined();
  });

  it("deve fazer login", async () => {
    const response = await fetch("http://localhost:8080/users/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(user),
    }).then((r) => r.json());
    console.log(response);

    expect(response).toBeDefined();
  });

  it("deve deletar, um usuario, pela id: ", async () => {
    const response: any = await fetch(
      "http://localhost:8080/users/delete/" + idUser,
      {
        method: "delete",
      }
    ).then((r) => r.json());
    expect(response.message).toBe("usuario deletado");
  });
});
