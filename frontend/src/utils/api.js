const API_BASE = '/api';

function getHeaders() {
  const apiKey = localStorage.getItem('ehr_api_key') || '';
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.error || 'API error');
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export async function reconcileMedication(payload) {
  const res = await fetch(`${API_BASE}/reconcile/medication`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function validateDataQuality(payload) {
  const res = await fetch(`${API_BASE}/validate/data-quality`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function recordDecision(requestId, decision, notes, overrideMed) {
  const res = await fetch(`${API_BASE}/reconcile/decision/${requestId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      decision,
      clinician_notes: notes,
      override_medication: overrideMed,
    }),
  });
  return handleResponse(res);
}

export async function healthCheck() {
  const res = await fetch('/health');
  return handleResponse(res);
}
