import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export interface DocumentUploadInput {
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: any;
}

export class DocumentVaultService {
  /**
   * 1. Get all documents in the user's Reusable Vault
   */
  async getUserDocuments(userId: string) {
    return prisma.userDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        applicationDocs: {
          select: {
            id: true,
            applicationId: true,
            reviewStatus: true,
            consented: true,
            application: {
              select: {
                id: true,
                programme: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * 2. Upload / Register a new document into the Reusable Vault
   */
  async uploadDocument(userId: string, input: DocumentUploadInput) {
    if (!input.documentType || !input.fileName) {
      throw createError(400, 'Document type and file name are required.');
    }

    // Auto-verify standard mock documents or set to VERIFIED for demo convenience
    const isMockVerified = true;

    return prisma.userDocument.upsert({
      where: {
        userId_documentType: {
          userId,
          documentType: input.documentType,
        },
      },
      update: {
        fileName: input.fileName,
        filePath: input.filePath || `/uploads/documents/${userId}/${input.fileName}`,
        fileSize: input.fileSize || 204800,
        mimeType: input.mimeType || 'application/pdf',
        verificationStatus: isMockVerified ? 'VERIFIED' : 'PENDING',
        verifiedAt: isMockVerified ? new Date() : null,
        metadata: input.metadata || {},
      },
      create: {
        userId,
        documentType: input.documentType,
        fileName: input.fileName,
        filePath: input.filePath || `/uploads/documents/${userId}/${input.fileName}`,
        fileSize: input.fileSize || 204800,
        mimeType: input.mimeType || 'application/pdf',
        verificationStatus: isMockVerified ? 'VERIFIED' : 'PENDING',
        verifiedAt: isMockVerified ? new Date() : null,
        metadata: input.metadata || {},
      },
    });
  }

  /**
   * 3. Delete a document from the vault (only if not locked in an active application)
   */
  async deleteDocument(userId: string, documentId: string) {
    const doc = await prisma.userDocument.findFirst({
      where: { id: documentId, userId },
      include: {
        applicationDocs: {
          include: {
            application: true,
          },
        },
      },
    });

    if (!doc) {
      throw createError(404, 'Document not found in your vault.');
    }

    // Check if locked in an approved or enrolled application
    const lockedInApp = doc.applicationDocs.some(
      ad => ad.application.status === 'APPROVED' || ad.application.status === 'ENROLLED'
    );

    if (lockedInApp) {
      throw createError(
        400,
        'Cannot delete document: It is actively linked to an approved/enrolled programme application.'
      );
    }

    await prisma.userDocument.delete({
      where: { id: documentId },
    });

    return { success: true, deletedId: documentId };
  }

  /**
   * 4. Profile Readiness Checklist & Percentage Calculator
   */
  async getProfileReadiness(userId: string) {
    const [user, documents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { publicProfile: true },
      }),
      prisma.userDocument.findMany({
        where: { userId },
      }),
    ]);

    if (!user) throw createError(404, 'User not found');

    const docMap = new Map(documents.map(d => [d.documentType, d]));

    // Checklist items evaluation
    const checklist = [
      {
        id: 'aadhaar_kyc',
        category: 'Identity',
        title: 'Aadhaar / e-KYC Verification',
        description: 'UIDAI e-KYC authentication or Aadhaar document upload',
        isComplete: user.isKycVerified || docMap.has('AADHAAR'),
        status: (user.isKycVerified || docMap.get('AADHAAR')?.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (docMap.has('AADHAAR') ? 'PENDING' : 'MISSING'),
        actionUrl: '/trainee/documents',
        weight: 20,
      },
      {
        id: 'face_enrollment',
        category: 'Biometric',
        title: 'Facial Biometric Enrollment',
        description: 'Biometric face registration for kiosk attendance',
        isComplete: Boolean(user.faceEnrolled),
        status: user.faceEnrolled ? 'VERIFIED' : 'MISSING',
        actionUrl: '/trainee/profile',
        weight: 20,
      },
      {
        id: 'academic_degree',
        category: 'Academic',
        title: 'Graduation Degree / Diploma',
        description: 'Proof of qualifying graduation or diploma certificate',
        isComplete: docMap.has('GRADUATION_DEGREE') || docMap.has('POST_GRADUATION'),
        status: (docMap.get('GRADUATION_DEGREE')?.verificationStatus === 'VERIFIED' || docMap.get('POST_GRADUATION')?.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (docMap.has('GRADUATION_DEGREE') ? 'PENDING' : 'MISSING'),
        actionUrl: '/trainee/documents',
        weight: 20,
      },
      {
        id: 'secondary_school',
        category: 'Academic',
        title: 'Class 10th / 12th Marksheet',
        description: 'Secondary or Higher Secondary school passing certificate',
        isComplete: docMap.has('10TH_MARKSHEET') || docMap.has('12TH_MARKSHEET'),
        status: (docMap.get('10TH_MARKSHEET')?.verificationStatus === 'VERIFIED' || docMap.get('12TH_MARKSHEET')?.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (docMap.has('10TH_MARKSHEET') ? 'PENDING' : 'MISSING'),
        actionUrl: '/trainee/documents',
        weight: 15,
      },
      {
        id: 'coop_affiliation',
        category: 'Cooperative Service',
        title: 'Cooperative Society Affiliation',
        description: 'Primary Agricultural Credit Society or Cooperative Milk Union link',
        isComplete: Boolean(user.cooperativeAffiliation && user.cooperativeAffiliation.length > 3),
        status: user.cooperativeAffiliation ? 'VERIFIED' : 'MISSING',
        actionUrl: '/trainee/profile',
        weight: 15,
      },
      {
        id: 'work_experience',
        category: 'Experience',
        title: 'Experience / Sponsorship Letter',
        description: 'Official nomination or service certificate from cooperative employer',
        isComplete: docMap.has('COOP_SPONSOR_LETTER') || docMap.has('EXPERIENCE_CERT'),
        status: (docMap.get('COOP_SPONSOR_LETTER')?.verificationStatus === 'VERIFIED' || docMap.get('EXPERIENCE_CERT')?.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (docMap.has('COOP_SPONSOR_LETTER') ? 'PENDING' : 'MISSING'),
        actionUrl: '/trainee/documents',
        weight: 10,
      },
    ];

    let totalScore = 0;
    checklist.forEach(item => {
      if (item.status === 'VERIFIED') {
        totalScore += item.weight;
      } else if (item.status === 'PENDING') {
        totalScore += Math.round(item.weight * 0.7);
      }
    });

    const readinessLevel = totalScore >= 80 ? 'HIGH' : (totalScore >= 50 ? 'MODERATE' : 'LOW');

    return {
      userId,
      readinessScore: totalScore,
      readinessLevel,
      totalDocuments: documents.length,
      verifiedDocumentsCount: documents.filter(d => d.verificationStatus === 'VERIFIED').length,
      pendingDocumentsCount: documents.filter(d => d.verificationStatus === 'PENDING').length,
      checklist,
      canApplyImmediately: totalScore >= 60,
    };
  }
}

export const documentVaultService = new DocumentVaultService();
