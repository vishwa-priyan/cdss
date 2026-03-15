import math
from .gemini_client import client

MOCK_GUIDELINES = [
    "Patients presenting with sudden severe chest pain radiating to the left arm should be evaluated immediately for acute myocardial infarction (AMI). ECG and troponin tests are indicated.",
    "New-onset shortness of breath with pleuritic chest pain and tachycardia suggests a possible pulmonary embolism. Consider D-dimer and CT pulmonary angiography.",
    "Fever, cough with purulent sputum, and localized chest crackles are indicative of community-acquired pneumonia. A chest X-ray and empirical antibiotics are recommended.",
    "For hypertension management, initial therapy for non-Black patients typically includes a thiazide diuretic, calcium channel blocker, ACE inhibitor, or ARB. Lifestyle modifications are universally recommended.",
    "Acute asthma exacerbation characterized by wheezing, shortness of breath, and chest tightness should be treated with inhaled short-acting beta-agonists (SABA) and systemic corticosteroids.",
    "Patients with suspected acute stroke presenting within 4.5 hours of symptom onset should be evaluated for IV alteplase eligibility. Immediate neuroimaging (non-contrast head CT) is critical.",
    "In cases of acute gastroenteritis, oral rehydration is the mainstay of treatment. Antibiotics are generally not recommended unless specific bacterial pathogens are suspected and confirmed.",
    "Unexplained weight loss, polydipsia, and polyuria warrant immediate assessment of blood glucose levels and HbA1c to evaluate for newly onset diabetes mellitus.",
    "Symptoms of major depressive disorder include persistent sad mood, anhedonia, changes in weight or sleep, and fatigue lasting at least two weeks. Treatment may involve psychotherapy and SSRIs.",
    "In suspected deep vein thrombosis (DVT), characterized by unilateral leg swelling, warmth, and pain, calculate the Wells score and proceed with compression ultrasonography if the probability is moderate to high."
]

class VectorStore:
    def __init__(self):
        self.documents = MOCK_GUIDELINES
        self.embeddings = []
        self.is_initialized = False

    def initialize(self):
        if self.is_initialized:
            return
        try:
            if not client:
                print("Skipping embeddings generation (no real API key)")
                return
            
            response = client.models.embed_content(
                model='gemini-embedding-001',
                contents=self.documents
            )
            self.embeddings = [e.values for e in response.embeddings]
            self.is_initialized = True
            print("Vector store initialized with mock guidelines.")
        except Exception as e:
            print(f"Failed to initialize vector store: {e}")

    def search(self, query: str, top_k: int = 2):
        if not self.is_initialized or not self.embeddings:
            return [self.documents[0], self.documents[1]]
        try:
            response = client.models.embed_content(
                model='gemini-embedding-001',
                contents=query
            )
            query_embedding = response.embeddings[0].values

            scored_docs = []
            for idx, emb in enumerate(self.embeddings):
                score = self.cosine_similarity(query_embedding, emb)
                scored_docs.append({"score": score, "text": self.documents[idx]})
            
            scored_docs.sort(key=lambda x: x["score"], reverse=True)
            return [doc["text"] for doc in scored_docs[:top_k]]
        except Exception as e:
            print(f"Vector store search failed: {e}")
            return []

    @staticmethod
    def cosine_similarity(vec_a, vec_b):
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = sum(a * a for a in vec_a)
        norm_b = sum(b * b for b in vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0
        return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b))

vector_store = VectorStore()
