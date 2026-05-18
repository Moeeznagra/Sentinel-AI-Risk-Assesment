export const EXAMPLE_POLICIES = [
  {
    name: "Access Control Framework",
    text: "POLICY 2.1: USER ACCESS MANAGEMENT. All employees must be assigned unique IDs. Password complexity must meet 14 characters including special symbols. Multi-factor authentication (MFA) is MANDATORY for all remote access via VPN. Access reviews occur annually. Terminated employee access is revoked within 24 hours. Administrative rights are restricted to the IT Operations team only. SECTION 2.2: ROLE-BASED ACCESS CONTROL (RBAC). Permissions are granted based on least privilege principles."
  },
  {
    name: "Data Identification & Privacy",
    text: "DATA GOVERNANCE MANIFEST 2024. All data must be classified into three categories: Public, Internal, and Restricted. PII (Personally Identifiable Information) must be encrypted at rest using AES-256. Data at transit must use TLS 1.3. We currently do NOT have an automated data discovery tool, relying instead on manual self-reporting by department heads. Annual data audits are conducted every December. Data retention for financial records is 7 years."
  },
  {
    name: "Incident Response Plan",
    text: "PROTOCOL RS-1: SECURITY INCIDENT MANAGEMENT. Upon detection of a breach, the Security Operations Center (SOC) must be notified immediately. The Incident Response Team (IRT) will be convened within 2 hours. We maintain a warm-site backup in the Eastern region, but failover testing has not been performed since Q3 of last year. Lessons learned meetings are required after any 'High' severity incident. Communication with law enforcement is handled exclusively by the Legal Department."
  }
];
