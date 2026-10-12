import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DiagramData } from '../types/flowchart';

export interface FirestoreDiagramDoc {
  id: string;
  userId: string;
  title: string;
  description?: string;
  direction?: 'top-down' | 'left-right';
  nodes: any[];
  edges: any[];
  pages?: any[];
  activePageIndex?: number;
  canvasBg?: string;
  gridType?: 'dots' | 'lines' | 'none';
  pageView?: boolean;
  originalImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DiagramVersion {
  id: string;
  diagramId: string;
  userId: string;
  title: string;
  description?: string;
  direction?: 'top-down' | 'left-right';
  nodes: any[];
  edges: any[];
  pages?: any[];
  activePageIndex?: number;
  canvasBg?: string;
  gridType?: 'dots' | 'lines' | 'none';
  pageView?: boolean;
  versionNote?: string;
  nodeCount: number;
  edgeCount: number;
  createdAt?: any;
}

export interface DiagramComment {
  id: string;
  diagramId: string;
  nodeId: string;
  userId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  resolved?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// -------------------------------------------------------------
// LocalStorage Resilience Layer (Synchronous, Offline & Fallback)
// -------------------------------------------------------------

export function getLocalDiagrams(userId: string): DiagramData[] {
  try {
    const raw = localStorage.getItem(`flowlify_diagrams_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalDiagram(userId: string, diagram: DiagramData) {
  try {
    const list = getLocalDiagrams(userId);
    const updated = [diagram, ...list.filter((d) => d.id !== diagram.id)];
    localStorage.setItem(`flowlify_diagrams_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage diagram save note:', e);
  }
}

export function removeLocalDiagram(userId: string, diagramId: string) {
  try {
    const list = getLocalDiagrams(userId);
    const updated = list.filter((d) => d.id !== diagramId);
    localStorage.setItem(`flowlify_diagrams_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage diagram remove note:', e);
  }
}

function getLocalVersions(userId: string, diagramId: string): DiagramVersion[] {
  try {
    const raw = localStorage.getItem(`flowlify_versions_${userId}_${diagramId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVersion(userId: string, diagramId: string, version: DiagramVersion) {
  try {
    const list = getLocalVersions(userId, diagramId);
    const updated = [version, ...list.filter((v) => v.id !== version.id)];
    localStorage.setItem(`flowlify_versions_${userId}_${diagramId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage version save note:', e);
  }
}

function removeLocalVersion(userId: string, diagramId: string, versionId: string) {
  try {
    const list = getLocalVersions(userId, diagramId);
    const updated = list.filter((v) => v.id !== versionId);
    localStorage.setItem(`flowlify_versions_${userId}_${diagramId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage version remove note:', e);
  }
}

function getLocalComments(userId: string, diagramId: string): DiagramComment[] {
  try {
    const raw = localStorage.getItem(`flowlify_comments_${userId}_${diagramId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalComment(userId: string, diagramId: string, comment: DiagramComment) {
  try {
    const list = getLocalComments(userId, diagramId);
    const updated = [...list.filter((c) => c.id !== comment.id), comment];
    localStorage.setItem(`flowlify_comments_${userId}_${diagramId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage comment save note:', e);
  }
}

function removeLocalComment(userId: string, diagramId: string, commentId: string) {
  try {
    const list = getLocalComments(userId, diagramId);
    const updated = list.filter((c) => c.id !== commentId);
    localStorage.setItem(`flowlify_comments_${userId}_${diagramId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage comment remove note:', e);
  }
}

// -------------------------------------------------------------
// Diagram Operations
// -------------------------------------------------------------

/**
 * Save or update diagram with both Local Cache and Firestore
 */
export async function saveDiagramToFirestore(
  userId: string,
  diagram: DiagramData,
  versionNote?: string,
  createVersionSnapshot = true
): Promise<string> {
  const diagramId = diagram.id || `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const savedDiagram: DiagramData = { ...diagram, id: diagramId };

  // Always save locally immediately
  saveLocalDiagram(userId, savedDiagram);

  const path = `users/${userId}/diagrams/${diagramId}`;

  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId);
    const existingSnap = await getDoc(docRef);

    const safeOriginalImage = diagram.originalImageUrl
      ? diagram.originalImageUrl.slice(0, 95000)
      : undefined;

    const payload: any = {
      id: diagramId,
      userId,
      title: (diagram.title || 'Untitled Flowchart').slice(0, 100),
      description: (diagram.description || '').slice(0, 500),
      direction: diagram.direction || 'top-down',
      nodes: diagram.nodes.slice(0, 500),
      edges: diagram.edges.slice(0, 500),
      updatedAt: serverTimestamp(),
    };

    if (safeOriginalImage) payload.originalImageUrl = safeOriginalImage;
    if (diagram.pages) payload.pages = diagram.pages;
    if (diagram.activePageIndex !== undefined) payload.activePageIndex = diagram.activePageIndex;
    if (diagram.canvasBg) payload.canvasBg = diagram.canvasBg.slice(0, 30);
    if (diagram.gridType) payload.gridType = diagram.gridType;
    if (diagram.pageView !== undefined) payload.pageView = diagram.pageView;

    const isNew = !existingSnap.exists();
    if (isNew) {
      payload.createdAt = serverTimestamp();
      await setDoc(docRef, payload);
    } else {
      await setDoc(docRef, payload, { merge: true });
    }

    if (createVersionSnapshot) {
      try {
        const note = versionNote || (isNew ? 'Initial diagram created' : `Saved checkpoint (${diagram.nodes.length} nodes)`);
        await saveDiagramVersion(userId, diagramId, savedDiagram, note);
      } catch (verErr) {
        console.warn('Auto-save version note warning:', verErr);
      }
    }

    return diagramId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return diagramId;
  }
}

/**
 * Save an explicit named historical snapshot version of a diagram
 */
export async function saveDiagramVersion(
  userId: string,
  diagramId: string,
  diagram: DiagramData,
  versionNote?: string
): Promise<string> {
  const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const versionObj: DiagramVersion = {
    id: versionId,
    diagramId,
    userId,
    title: (diagram.title || 'Untitled Flowchart').slice(0, 100),
    description: (diagram.description || '').slice(0, 500),
    direction: diagram.direction || 'top-down',
    nodes: diagram.nodes.slice(0, 500),
    edges: diagram.edges.slice(0, 500),
    pages: diagram.pages,
    activePageIndex: diagram.activePageIndex,
    canvasBg: diagram.canvasBg ? diagram.canvasBg.slice(0, 30) : undefined,
    gridType: diagram.gridType,
    pageView: diagram.pageView,
    versionNote: (versionNote || `Version snapshot (${diagram.nodes.length} nodes)`).slice(0, 200),
    nodeCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
    createdAt: new Date().toISOString(),
  };

  saveLocalVersion(userId, diagramId, versionObj);

  const path = `users/${userId}/diagrams/${diagramId}/versions/${versionId}`;

  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId, 'versions', versionId);
    const payload: any = {
      ...versionObj,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
    return versionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return versionId;
  }
}

/**
 * Real-time listener for historical versions of a diagram
 */
export function subscribeToDiagramVersions(
  userId: string,
  diagramId: string,
  onUpdate: (versions: DiagramVersion[]) => void
): Unsubscribe {
  // Feed local versions immediately
  const cached = getLocalVersions(userId, diagramId);
  if (cached.length > 0) {
    onUpdate(cached);
  }

  const path = `users/${userId}/diagrams/${diagramId}/versions`;
  const collectionRef = collection(db, 'users', userId, 'diagrams', diagramId, 'versions');
  const q = query(collectionRef, orderBy('createdAt', 'desc'));

  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: DiagramVersion[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as DiagramVersion;
          items.push({
            id: data.id,
            diagramId: data.diagramId,
            userId: data.userId,
            title: data.title,
            description: data.description,
            direction: data.direction,
            nodes: data.nodes || [],
            edges: data.edges || [],
            pages: data.pages,
            activePageIndex: data.activePageIndex,
            canvasBg: data.canvasBg,
            gridType: data.gridType,
            pageView: data.pageView,
            versionNote: data.versionNote,
            nodeCount: data.nodeCount ?? (data.nodes?.length || 0),
            edgeCount: data.edgeCount ?? (data.edges?.length || 0),
            createdAt: data.createdAt,
          });
        });
        if (items.length > 0) {
          localStorage.setItem(`flowlify_versions_${userId}_${diagramId}`, JSON.stringify(items));
          onUpdate(items);
        } else {
          onUpdate(getLocalVersions(userId, diagramId));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        onUpdate(getLocalVersions(userId, diagramId));
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

/**
 * Delete a specific historical version
 */
export async function deleteDiagramVersion(
  userId: string,
  diagramId: string,
  versionId: string
): Promise<void> {
  removeLocalVersion(userId, diagramId, versionId);
  const path = `users/${userId}/diagrams/${diagramId}/versions/${versionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId, 'versions', versionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for user's diagrams list
 */
export function subscribeToUserDiagrams(
  userId: string,
  onUpdate: (diagrams: DiagramData[]) => void
): Unsubscribe {
  // Feed local diagrams immediately so there is zero latency
  const localList = getLocalDiagrams(userId);
  if (localList.length > 0) {
    onUpdate(localList);
  }

  const path = `users/${userId}/diagrams`;
  const collectionRef = collection(db, 'users', userId, 'diagrams');
  const q = query(collectionRef, orderBy('updatedAt', 'desc'));

  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: DiagramData[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as FirestoreDiagramDoc;
          items.push({
            id: data.id,
            title: data.title,
            description: data.description,
            direction: data.direction,
            nodes: data.nodes || [],
            edges: data.edges || [],
            pages: data.pages,
            activePageIndex: data.activePageIndex,
            canvasBg: data.canvasBg,
            gridType: data.gridType,
            pageView: data.pageView,
            originalImageUrl: data.originalImageUrl,
          });
        });
        if (items.length > 0) {
          localStorage.setItem(`flowlify_diagrams_${userId}`, JSON.stringify(items));
          onUpdate(items);
        } else {
          onUpdate(getLocalDiagrams(userId));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        onUpdate(getLocalDiagrams(userId));
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

/**
 * Delete diagram
 */
export async function deleteDiagramFromFirestore(
  userId: string,
  diagramId: string
): Promise<void> {
  removeLocalDiagram(userId, diagramId);
  const path = `users/${userId}/diagrams/${diagramId}`;
  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Add a comment to a specific node
 */
export async function addNodeComment(
  userId: string,
  diagramId: string,
  comment: {
    nodeId: string;
    authorName: string;
    authorPhotoURL?: string;
    content: string;
  }
): Promise<string> {
  const commentId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const commentObj: DiagramComment = {
    id: commentId,
    diagramId,
    nodeId: comment.nodeId,
    userId,
    authorName: comment.authorName || 'Collaborator',
    authorPhotoURL: comment.authorPhotoURL,
    content: comment.content.trim(),
    resolved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveLocalComment(userId, diagramId, commentObj);

  const path = `users/${userId}/diagrams/${diagramId}/comments/${commentId}`;

  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId, 'comments', commentId);
    const commentData: any = {
      ...commentObj,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, commentData);
    return commentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return commentId;
  }
}

/**
 * Update an existing node comment
 */
export async function updateNodeComment(
  userId: string,
  diagramId: string,
  commentId: string,
  updates: {
    content?: string;
    resolved?: boolean;
  }
): Promise<void> {
  const existingList = getLocalComments(userId, diagramId);
  const target = existingList.find((c) => c.id === commentId);
  if (target) {
    if (updates.content !== undefined) target.content = updates.content.trim();
    if (updates.resolved !== undefined) target.resolved = updates.resolved;
    target.updatedAt = new Date().toISOString();
    saveLocalComment(userId, diagramId, target);
  }

  const path = `users/${userId}/diagrams/${diagramId}/comments/${commentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId, 'comments', commentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data();
      const payload: any = {
        ...current,
        updatedAt: serverTimestamp(),
      };
      if (typeof updates.resolved === 'boolean') payload.resolved = updates.resolved;
      if (updates.content !== undefined) payload.content = updates.content.trim();
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a comment
 */
export async function deleteNodeComment(
  userId: string,
  diagramId: string,
  commentId: string
): Promise<void> {
  removeLocalComment(userId, diagramId, commentId);
  const path = `users/${userId}/diagrams/${diagramId}/comments/${commentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'diagrams', diagramId, 'comments', commentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for comments on a diagram
 */
export function subscribeToDiagramComments(
  userId: string,
  diagramId: string,
  onUpdate: (comments: DiagramComment[]) => void
): Unsubscribe {
  const cached = getLocalComments(userId, diagramId);
  if (cached.length > 0) {
    onUpdate(cached);
  }

  const path = `users/${userId}/diagrams/${diagramId}/comments`;
  const collectionRef = collection(db, 'users', userId, 'diagrams', diagramId, 'comments');
  const q = query(collectionRef, orderBy('createdAt', 'asc'));

  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: DiagramComment[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: data.id,
            diagramId: data.diagramId,
            nodeId: data.nodeId,
            userId: data.userId,
            authorName: data.authorName,
            authorPhotoURL: data.authorPhotoURL,
            content: data.content,
            resolved: Boolean(data.resolved),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        if (items.length > 0) {
          localStorage.setItem(`flowlify_comments_${userId}_${diagramId}`, JSON.stringify(items));
          onUpdate(items);
        } else {
          onUpdate(getLocalComments(userId, diagramId));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        onUpdate(getLocalComments(userId, diagramId));
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}
