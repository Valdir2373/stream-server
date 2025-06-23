// src/core/services/IEmailService.ts

import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";

export interface IEmailService {
  getTransportToSendEmail(): any;
  sendLinkVerificationEmail(
    email: string,
    link: string,
    tempo: number
  ): Promise<any>;
  getHtmlBody(link: string, tempo: number): string;
  sendEmailVerificationUser(userOutput: UserOutputDTO): Promise<any>;
}
