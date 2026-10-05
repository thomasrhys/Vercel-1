import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_BUCKET_URL!;

export async function listCoverImages(prefix = "covers/") {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  });

  const response = await r2.send(command);
  return response.Contents ?? [];
}

export async function uploadCoverImage(key: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      ACL: "public-read",
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteCoverImage(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
