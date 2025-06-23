import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { UsersService } from "../../infra/service/UsersService";
import { UserRepository } from "../../infra/repository/UsersRepository";
import { ConfigEnv } from "../../config/Config.env";
import { MongooseDataAccess } from "../../infra/database/MoongoseDataAcess";
import { MongooseHandler } from "../../infra/database/MongooseHandler";
import mongoose from "mongoose";
import { ConfigDB } from "../../config/ConfigDB";

let dbHandler: MongooseHandler;
let dataAcess: MongooseDataAccess;
let usersRepository: UserRepository;
let usersService: UsersService;
let idUser: string = "";
let emailUser: string = "";

const userTemplate = {
  username: "",
  useremail: "",
  userpassword: "vava3146",
};

describe("Aqui está todos os testes, da service, dos usuarios: ", () => {
  beforeAll(async () => {
    const dbConfig = new ConfigDB();
    const url = dbConfig.getConfigDB();

    dbHandler = new MongooseHandler(url);
    dataAcess = new MongooseDataAccess(dbHandler);
    usersRepository = new UserRepository(dataAcess);
    usersService = new UsersService(usersRepository);

    await dbHandler.getConnection();
    try {
      await mongoose.connection.collection("users").deleteMany({});
      console.log("Coleção 'users' limpa antes dos testes.");
    } catch (error) {
      console.error("Erro ao limpar a coleção 'users':", error);
    }
  });

  afterAll(async () => {
    if (dbHandler) {
      await dbHandler.closePool();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Mongoose desconectado forçosamente no afterAll.");
    }
  });

  beforeEach(async () => {
    // Gera um email e username únicos e garantidos para CADA TESTE
    const timestamp = Date.now();
    // const uniqueSuffix = timestamp.toString().substring(8); // Ex: 123456
    userTemplate.useremail = `test_user_vavateste123@example.com`;
    userTemplate.username = `user_vavateste123`; // Garante que tem entre 5 e 20 chars

    // Reseta idUser e emailUser para garantir que cada teste comece limpo
    // idUser = "";
    // emailUser = "";
  });

  it("Deve criar um usuario: ", async () => {
    const newUser: UserOutputDTO | string = await usersService.createNewUser(
      userTemplate
    );

    console.log("Retorno de createNewUser:", newUser); // ADICIONADO: Log para depuração

    if (typeof newUser === "string") {
      // Se retornar string, é um erro. Verifica se é um erro esperado (ex: email já existe)
      // ou se é um erro genérico que deve falhar o teste.
      expect(newUser).not.toContain("Usuário com este email já existe."); // Se não é esse o erro esperado
      fail(`Falha inesperada na criação do usuário: ${newUser}`); // Força falha para qualquer outro erro
    } else {
      expect(typeof newUser.id).toBe("string");
      idUser = newUser.id;
      expect(newUser.email).toBeDefined();
      emailUser = newUser.email;
      console.log(newUser);

      expect(newUser.username.length).toBeGreaterThanOrEqual(5);
      expect(newUser.username.length).toBeLessThanOrEqual(20);
    }
  });

  it("Deve pegar, o usuario, pela id: ", async () => {
    // Para garantir que este teste pode ser executado, podemos criar um usuário aqui
    // se idUser não for setado pelo teste anterior. OU assumir dependência do primeiro teste.
    // Manter a dependência é mais rápido, mas se o primeiro teste falha, este também falha.
    // Vamos assumir a dependência por enquanto e focar em fazer o primeiro teste passar.
    expect(idUser).not.toBe("");
    const userById: UserOutputDTO | undefined = await usersService.getByIdUser(
      idUser
    );
    expect(userById).toBeDefined();
    expect(userById?.id).toBe(idUser);
  });

  it("Deve pegar, um usuario, pelo email: ", async () => {
    expect(emailUser).not.toBe("");
    const userByEmail: UserOutputDTO | undefined =
      await usersService.getByEmailUser(emailUser);
    expect(userByEmail).toBeDefined();
    expect(userByEmail?.email).toBe(emailUser);
  });

  it("Deve pegar, todos os, usuarios: ", async () => {
    const allUsers: UserOutputDTO[] | undefined =
      await usersService.getAllUsers();
    expect(allUsers).toBeDefined();
    expect(Array.isArray(allUsers)).toBe(true);
    // Deve haver pelo menos o usuário criado pelo primeiro teste
    expect(allUsers!.length).toBeGreaterThan(0);
  });

  it("deve fazer login no usuario", async () => {
    expect(userTemplate.useremail).not.toBe("");
    console.log(userTemplate);

    const response = await usersService.loginUserService(userTemplate);
    expect(response).toBeDefined();
    // Adicione asserções específicas para o login (ex: expect(response.token).toBeDefined())
  });

  it("deve atualizar um usuario pelo email: ", async () => {
    expect(emailUser).not.toBe("");
    const userToUpdate: UserInputDTO = {
      useremail: emailUser,
      username: "updated_user_name",
      userpassword: "novaSenhaForte!",
    };
    const userUpdated = await usersService.updateUserByEmail(userToUpdate);
    console.log(userUpdated);

    expect(userUpdated).toBeDefined();
    if (!userUpdated) return;

    expect(userUpdated.username).toBe("updated_user_name");
    expect(userUpdated.email).toBe(emailUser);
  });

  it("deve deletar, um usuario, pela id: ", async () => {
    expect(idUser).not.toBe("");
    const response = await usersService.deleteUser(idUser);

    // Verifique o tipo de retorno do seu UsersService.deleteUser:
    // Se ele retorna diretamente o número de linhas afetadas:
    // expect(response).toBe(1); // Se 1 linha foi deletada
    // Se ele retorna um objeto { message: "..." }:
    expect(response).toBeDefined(); // Garante que a resposta não é undefined/null
    expect(response.message).toBe("usuario deletado"); // Exige que o objeto tenha .message

    const deletedUser = await usersService.deleteUser(idUser); // Corrigido aqui
    expect(deletedUser).toBeUndefined();
  });
});
