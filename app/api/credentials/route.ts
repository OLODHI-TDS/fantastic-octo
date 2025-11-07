import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { CreateCredentialSchema } from '@/types/credential'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production-32b'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = parts[1]
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// GET /api/credentials - List all credentials (optionally filter by environment)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const environmentId = searchParams.get('environmentId')

    const credentials = await prisma.credential.findMany({
      where: environmentId ? { environmentId } : undefined,
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Decrypt secrets for response based on auth type
    const decryptedCredentials = credentials.map(cred => {
      const decrypted: any = { ...cred }

      if (cred.authType === 'apikey' && cred.apiKey) {
        decrypted.apiKey = decrypt(cred.apiKey)
      } else if (cred.authType === 'oauth2' && cred.clientSecret) {
        decrypted.clientSecret = decrypt(cred.clientSecret)
      }

      return decrypted
    })

    return NextResponse.json(decryptedCredentials)
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

// POST /api/credentials - Create new credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateCredentialSchema.parse(body)

    // Prepare data for database, encrypting secrets based on auth type
    const dbData: any = { ...validatedData }

    if (validatedData.authType === 'apikey') {
      dbData.apiKey = encrypt(validatedData.apiKey)
      dbData.clientId = null
      dbData.clientSecret = null
    } else {
      // oauth2
      dbData.clientSecret = encrypt(validatedData.clientSecret)
      dbData.apiKey = null
    }

    const credential = await prisma.credential.create({
      data: dbData,
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    // Return unencrypted for immediate use
    const response: any = { ...credential }
    if (validatedData.authType === 'apikey') {
      response.apiKey = validatedData.apiKey
    } else {
      response.clientSecret = validatedData.clientSecret
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating credential:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: 500 }
    )
  }
}
