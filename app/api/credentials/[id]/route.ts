import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { UpdateCredentialSchema } from '@/types/credential'
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

// GET /api/credentials/[id] - Get single credential
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const credential = await prisma.credential.findUnique({
      where: { id },
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

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    // Decrypt secrets based on auth type
    const response: any = { ...credential }
    if (credential.authType === 'apikey' && credential.apiKey) {
      response.apiKey = decrypt(credential.apiKey)
    } else if (credential.authType === 'oauth2' && credential.clientSecret) {
      response.clientSecret = decrypt(credential.clientSecret)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching credential:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credential' },
      { status: 500 }
    )
  }
}

// PUT /api/credentials/[id] - Update credential
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateCredentialSchema.parse({ ...body, id })

    const updateData: any = { ...validatedData }
    delete updateData.id

    // Encrypt secrets based on auth type if they're being updated
    if (validatedData.authType === 'apikey') {
      if (updateData.apiKey) {
        updateData.apiKey = encrypt(updateData.apiKey)
      }
    } else if (validatedData.authType === 'oauth2') {
      if (updateData.clientSecret) {
        updateData.clientSecret = encrypt(updateData.clientSecret)
      }
    }

    const credential = await prisma.credential.update({
      where: { id },
      data: updateData,
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

    // Return unencrypted secrets that were just updated
    const response: any = { ...credential }
    if (credential.authType === 'apikey') {
      response.apiKey = body.apiKey || (credential.apiKey ? decrypt(credential.apiKey) : null)
    } else if (credential.authType === 'oauth2') {
      response.clientSecret = body.clientSecret || (credential.clientSecret ? decrypt(credential.clientSecret) : null)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating credential:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    )
  }
}

// DELETE /api/credentials/[id] - Delete credential
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.credential.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting credential:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    )
  }
}
