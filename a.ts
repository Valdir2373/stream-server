import { CompileGoToExe } from "./src/application/stream/use-case/CompileGoToExe";
import { ConfigDB } from "./src/config/ConfigDB";
import { MongooseDataAccess } from "./src/infra/database/MoongoseDataAcess";
import { MongooseHandler } from "./src/infra/database/MongooseHandler";

import { StreamRepository } from "./src/infra/repository/StreamRepository";

const configDB = new ConfigDB();
const dataHandler = new MongooseHandler(configDB.getConfigDB());
const dataAcess = new MongooseDataAccess(dataHandler);
const streamRepository = new StreamRepository(dataAcess);

const compileGoToExe = new CompileGoToExe();
compileGoToExe.execute("1234");
