import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient, Seller } from '@prisma/client';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

export type AuthUser = { sellerId: number; email: string };

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();
  private readonly secret = process.env.AUTH_SECRET || 'gettally-local-demo-secret-change-me';
  private readonly revokedTokens = new Set<string>();

  async register(input: { name: string; email: string; phone: string; password: string; businessName?: string }) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const phone = this.normalizePhone(input.phone);
    if (!name || name.length < 2) throw new BadRequestException('Name must be at least 2 characters');
    this.validateGmail(email);
    this.validatePassword(input.password);
    const existing = await this.prisma.seller.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('An account with this Gmail already exists');
    const passwordHash = await this.hashPassword(input.password);
    const seller = await this.prisma.seller.create({
      data: { name, email, phone, passwordHash, businessName: input.businessName?.trim() || null },
    });
    return this.authResponse(seller);
  }

  async login(emailInput: string, password: string) {
    const email = emailInput?.trim().toLowerCase();
    this.validateGmail(email);
    const seller = await this.prisma.seller.findUnique({ where: { email } });
    if (!seller?.passwordHash || !(await this.verifyPassword(password, seller.passwordHash))) {
      throw new UnauthorizedException('Invalid Gmail or password');
    }
    return this.authResponse(seller);
  }

  async profile(sellerId: number) {
    const seller = await this.findSeller(sellerId);
    return this.publicSeller(seller);
  }

  async updateProfile(sellerId: number, input: { name?: string; phone?: string; businessName?: string; city?: string; bio?: string; monthlyGoal?: number; profileComplete?: boolean }) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      if (input.name.trim().length < 2) throw new BadRequestException('Name must be at least 2 characters');
      data.name = input.name.trim();
    }
    if (input.phone !== undefined) data.phone = this.normalizePhone(input.phone);
    if (input.businessName !== undefined) data.businessName = input.businessName.trim() || null;
    if (input.city !== undefined) data.city = input.city.trim() || null;
    if (input.bio !== undefined) data.bio = input.bio.trim() || null;
    if (input.monthlyGoal !== undefined) {
      if (!Number.isFinite(Number(input.monthlyGoal)) || Number(input.monthlyGoal) < 0) throw new BadRequestException('Monthly goal must be zero or greater');
      data.monthlyGoal = Number(input.monthlyGoal);
    }
    if (input.profileComplete !== undefined) data.profileComplete = Boolean(input.profileComplete);
    const seller = await this.prisma.seller.update({ where: { id: sellerId }, data });
    return this.publicSeller(seller);
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      if (this.revokedTokens.has(token)) throw new Error('Revoked token');
      const [encoded, signature] = token.split('.');
      if (!encoded || !signature) throw new Error('Malformed token');
      const expected = this.sign(encoded);
      if (signature !== expected) throw new Error('Invalid signature');
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as AuthUser & { exp: number };
      if (!payload.sellerId || payload.exp < Date.now()) throw new Error('Expired token');
      const seller = await this.prisma.seller.findUnique({ where: { id: payload.sellerId }, select: { id: true, email: true } });
      if (!seller) throw new Error('Seller no longer exists');
      return { sellerId: seller.id, email: seller.email };
    } catch {
      throw new UnauthorizedException('Please log in again');
    }
  }

  revokeToken(token: string) {
    if (token) this.revokedTokens.add(token);
    return { success: true };
  }

  private async authResponse(seller: Seller) {
    return { success: true, token: this.createToken(seller), seller: this.publicSeller(seller) };
  }
  private publicSeller(seller: Seller) {
    const { passwordHash: _passwordHash, ...safe } = seller;
    return safe;
  }
  private createToken(seller: Seller) {
    const encoded = Buffer.from(JSON.stringify({ sellerId: seller.id, email: seller.email, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString('base64url');
    return `${encoded}.${this.sign(encoded)}`;
  }
  private sign(value: string) { return createHmac('sha256', this.secret).update(value).digest('base64url'); }
  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString('hex')}`;
  }
  private async verifyPassword(password: string, stored: string) {
    const [salt, expectedHex] = stored.split(':');
    if (!salt || !expectedHex) return false;
    const actual = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  private validateGmail(email: string) {
    if (!/^[a-z0-9](?:[a-z0-9._+-]{0,62})@gmail\.com$/.test(email)) throw new BadRequestException('Please use a valid Gmail address');
  }
  private validatePassword(password: string) {
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new BadRequestException('Password must be at least 8 characters and include a letter and a number');
  }
  private normalizePhone(value: string) {
    const raw = String(value || '').replace(/[\s-]/g, '');
    const normalized = raw.startsWith('+880') ? `0${raw.slice(4)}` : raw;
    if (!/^01[3-9]\d{8}$/.test(normalized)) throw new BadRequestException('Enter a valid Bangladesh mobile number, such as 01712345678');
    return normalized;
  }
  private async findSeller(id: number) {
    if (!Number.isInteger(id) || id < 1) throw new UnauthorizedException('Invalid seller');
    const seller = await this.prisma.seller.findUnique({ where: { id } });
    if (!seller) throw new UnauthorizedException('Seller account not found');
    return seller;
  }
}
