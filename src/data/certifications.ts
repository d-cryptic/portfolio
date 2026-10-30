export type CertificationGroup = "kubernetes" | "cncf";

export type CertificationLevel = "Foundational" | "Intermediate" | "Advanced";

export type Certification = {
  id: string;
  shortName: string;
  name: string;
  issuedOn: string;
  expiresOn: string | null;
  level: CertificationLevel;
  group: CertificationGroup;
  image: string;
};

export const CREDLY_PROFILE_URL = "https://www.credly.com/users/barun-debnath";

export const credlyBadgeUrl = (id: string): string =>
  `https://www.credly.com/badges/${id}`;

export const certificationFilters = [
  { key: "all", label: "All" },
  { key: "kubernetes", label: "Kubernetes" },
  { key: "cncf", label: "CNCF projects" },
] as const;

export const certifications: Certification[] = [
  {
    id: "c5980844-b295-42d0-80f4-f97452abfccc",
    shortName: "Kubestronaut",
    name: "Kubestronaut",
    issuedOn: "2026-08-23",
    expiresOn: null,
    level: "Advanced",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/cd6c6449-6814-4613-a2d3-13cf4ac5be4f/image.png",
  },
  {
    id: "79f2ee72-8b1c-4f0f-af2c-d6e6f87de561",
    shortName: "CKA",
    name: "CKA: Certified Kubernetes Administrator",
    issuedOn: "2026-08-07",
    expiresOn: "2028-08-11",
    level: "Intermediate",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/8b8ed108-e77d-4396-ac59-2504583b9d54/cka_from_cncfsite__281_29.png",
  },
  {
    id: "9623b2f1-6d3b-455f-9b49-8340c3d6a30c",
    shortName: "CKAD",
    name: "CKAD: Certified Kubernetes Application Developer",
    issuedOn: "2026-07-31",
    expiresOn: "2028-07-30",
    level: "Intermediate",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/cc8adc83-1dc6-4d57-8e20-22171247e052/blob",
  },
  {
    id: "5de2713f-3fd8-4cf0-be56-c91c26ed29d0",
    shortName: "CKS",
    name: "CKS: Certified Kubernetes Security Specialist",
    issuedOn: "2026-08-12",
    expiresOn: "2028-08-11",
    level: "Intermediate",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/9945dfcb-1cca-4529-85e6-db1be3782210/kubernetes-security-specialist-logo2.png",
  },
  {
    id: "5a1876ae-1705-43cc-8214-e4e15cd35c42",
    shortName: "KCSA",
    name: "KCSA: Kubernetes and Cloud Native Security Associate",
    issuedOn: "2026-06-24",
    expiresOn: "2028-08-11",
    level: "Intermediate",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/67dd8a95-8876-4051-9cb9-3d97c204f85a/image.png",
  },
  {
    id: "70a177c3-bd16-4934-9ac3-c98e29de7f5e",
    shortName: "KCNA",
    name: "KCNA: Kubernetes and Cloud Native Associate",
    issuedOn: "2026-05-22",
    expiresOn: "2028-08-11",
    level: "Foundational",
    group: "kubernetes",
    image:
      "https://images.credly.com/images/f28f1d88-428a-47f6-95b5-7da1dd6c1000/KCNA_badge.png",
  },
  {
    id: "2defc195-1230-45f9-b76f-16393914ad44",
    shortName: "ICA",
    name: "ICA: Istio Certified Associate",
    issuedOn: "2026-09-03",
    expiresOn: "2028-09-02",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/d7d4ddc8-7df8-4c03-9343-507b51e0ef99/image.png",
  },
  {
    id: "998be868-673a-4835-bb8e-4b5196e1db44",
    shortName: "CNPA",
    name: "CNPA: Certified Cloud Native Platform Engineering Associate",
    issuedOn: "2026-09-02",
    expiresOn: "2028-09-01",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/bf3fc97e-a12c-4567-86ea-01639b9b15fb/blob",
  },
  {
    id: "fa3b61a6-2ae7-4179-b6dd-bc87b27142fa",
    shortName: "KCA",
    name: "KCA: Kyverno Certified Associate",
    issuedOn: "2026-08-31",
    expiresOn: "2028-08-30",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/2592935a-d8fa-405d-b40a-711a75454fc2/image.png",
  },
  {
    id: "87c7204b-61f9-421d-ba7f-d00e959061d2",
    shortName: "CCA",
    name: "CCA: Cilium Certified Associate",
    issuedOn: "2026-08-29",
    expiresOn: "2028-08-28",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/729367b3-0344-4b00-a6da-53e1807f808a/image.png",
  },
  {
    id: "91b06ecb-1013-4bb7-998b-2bbb50b2c990",
    shortName: "OTCA",
    name: "OTCA: OpenTelemetry Certified Associate",
    issuedOn: "2026-08-28",
    expiresOn: "2028-08-27",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/3d3f7131-83a4-4427-8a68-150ca90bcc23/blob",
  },
  {
    id: "27058baf-86c3-4e6d-ba5f-c4399ea6d3a9",
    shortName: "CAPA",
    name: "CAPA: Certified Argo Project Associate",
    issuedOn: "2026-08-27",
    expiresOn: "2028-08-26",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/12624f9e-6b4a-43f0-b7a2-afb2c6cf8059/image.png",
  },
  {
    id: "ddc5f9d1-2895-4462-ae1f-a14e4089f28c",
    shortName: "CGOA",
    name: "CGOA: Certified GitOps Associate",
    issuedOn: "2026-08-26",
    expiresOn: "2028-08-25",
    level: "Intermediate",
    group: "cncf",
    image:
      "https://images.credly.com/images/7219d055-4e97-439c-b244-8fbe885fa06b/image.png",
  },
  {
    id: "fe68b22d-3e13-41bf-b7f3-29ae28d4be8e",
    shortName: "PCA",
    name: "PCA: Prometheus Certified Associate",
    issuedOn: "2026-08-25",
    expiresOn: "2028-08-24",
    level: "Foundational",
    group: "cncf",
    image:
      "https://images.credly.com/images/c34436dc-1cfd-4125-a862-35f9c86ca17f/image.png",
  },
];

export const kubestronaut = certifications[0];

export const formatBadgeDate = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
