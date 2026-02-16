import { useEffect, useMemo, useState } from "react";
import { safeInvoke } from "../lib/invoke";
import "../styles/editcards.css";

type Props = {
  sessionToken: string;
  onBack: () => void;
};

type CardStatus = "APPROVED" | "PENDING" | "REJECTED";
type Category = "ORGANS" | "BONES";

type SortMode = "NEWEST" | "OLDEST";

type StatusFilter = "ALL" | CardStatus;
type CategoryFilter = "ALL" | Category;

type CardAdminItem = {
  id: number;
  category: string; // "ORGANS" | "BONES"
  english: string;
  latin: string;
  image_path: string;
  status: string;   // "APPROVED" | "PENDING" | "REJECTED"
};

type RowDraft = {
  english: string;
  latin: string;
  image_path: string;
  saving: boolean;
  deleting: boolean;
  dirty: boolean;
  err?: string;
  ok?: string;
};

export default function EditCardsPage({ sessionToken, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<CardAdminItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await safeInvoke<CardAdminItem[]>("list_all_cards_admin", { sessionToken });

      setCards(rows);

      // init drafts for new cards only (keep user edits if already typed)
      setDrafts((prev) => {
        const next = { ...prev };
        for (const c of rows) {
          if (!next[c.id]) {
            next[c.id] = {
              english: c.english ?? "",
              latin: c.latin ?? "",
              image_path: c.image_path ?? "",
              saving: false,
              deleting: false,
              dirty: false,
            };
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...cards];

    if (categoryFilter !== "ALL") {
      list = list.filter((c) => c.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((c) => c.status === statusFilter);
    }

    list.sort((a, b) => (sortMode === "NEWEST" ? b.id - a.id : a.id - b.id));
    return list;
  }, [cards, categoryFilter, statusFilter, sortMode]);

  const updateDraft = (id: number, patch: Partial<RowDraft>) => {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  };

  const validate = (d: RowDraft) => {
    if (!d.english.trim() || !d.latin.trim() || !d.image_path.trim()) {
      return "Please fill in English, Latin and Image path.";
    }
    return null;
  };

  const save = async (id: number) => {
    const d = drafts[id];
    if (!d) return;

    const err = validate(d);
    if (err) {
      updateDraft(id, { err, ok: undefined });
      return;
    }

    updateDraft(id, { saving: true, err: undefined, ok: undefined });

    try {
      await safeInvoke<void>("admin_update_card", {
        input: {
          sessionToken,
          id,
          english: d.english,
          latin: d.latin,
          imagePath: d.image_path,
        },
      });

      // update cards list (optimistic sync)
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, english: d.english, latin: d.latin, image_path: d.image_path }
            : c
        )
      );

      updateDraft(id, { saving: false, dirty: false, ok: "Saved ✅" });
      setTimeout(() => updateDraft(id, { ok: undefined }), 1800);
    } catch (e: any) {
      updateDraft(id, {
        saving: false,
        err: e?.message ?? "Save failed. Check console.",
      });
    }
  };

  const askDelete = (id: number) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const id = confirmId;
    if (!id) return;

    setConfirmOpen(false);

    updateDraft(id, { deleting: true, err: undefined, ok: undefined });

    try {
      await safeInvoke<void>("admin_delete_card", { sessionToken, id });

      // remove locally
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e: any) {
      updateDraft(id, {
        deleting: false,
        err: e?.message ?? "Delete failed. Check backend command.",
      });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="ec-page">
      <div className="ec-card">
        <div className="ec-topbar">
          <div>
            <div className="ec-title">Edit cards</div>
            <div className="ec-subtitle">
              Edit titles and image paths. You can also delete cards.
            </div>
          </div>

          <button className="ec-ghost" onClick={onBack} type="button">
            ← Back
          </button>
        </div>

        <div className="ec-controls">
          <div className="ec-control">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            >
              <option value="ALL">All</option>
              <option value="ORGANS">Organs</option>
              <option value="BONES">Bones</option>
            </select>
          </div>

          <div className="ec-control">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">All</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="ec-control">
            <label>Sort</label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="NEWEST">Newest</option>
              <option value="OLDEST">Oldest</option>
            </select>
          </div>

          <button className="ec-ghost" onClick={() => load()} type="button" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>

          <div className="ec-count">
            Showing <b>{filtered.length}</b> / {cards.length}
          </div>
        </div>

        <div className="ec-list">
          {filtered.map((c) => {
            const d = drafts[c.id];
            if (!d) return null;

            const status = (c.status as CardStatus) ?? "APPROVED";
            const cat = (c.category as Category) ?? "ORGANS";

            return (
              <div className="ec-item" key={c.id}>
                <div className="ec-thumb">
                  {d.image_path?.trim() ? (
                    <img
                      src={d.image_path}
                      alt="card"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  {!d.image_path?.trim() ? <div className="ec-thumb-fallback">No image</div> : null}
                </div>

                <div className="ec-main">
                  <div className="ec-badges">
                    <span className={`ec-badge cat`}>{cat}</span>
                    <span className={`ec-badge st ${status.toLowerCase()}`}>{status}</span>
                    <span className="ec-id">#{c.id}</span>
                  </div>

                  <div className="ec-grid">
                    <div className="ec-field">
                      <label>English</label>
                      <input
                        value={d.english}
                        onChange={(e) =>
                          updateDraft(c.id, {
                            english: e.target.value,
                            dirty: true,
                            ok: undefined,
                            err: undefined,
                          })
                        }
                      />
                    </div>

                    <div className="ec-field">
                      <label>Latin</label>
                      <input
                        value={d.latin}
                        onChange={(e) =>
                          updateDraft(c.id, {
                            latin: e.target.value,
                            dirty: true,
                            ok: undefined,
                            err: undefined,
                          })
                        }
                      />
                    </div>

                    <div className="ec-field ec-span2">
                      <label>Image path</label>
                      <input
                        value={d.image_path}
                        onChange={(e) =>
                          updateDraft(c.id, {
                            image_path: e.target.value,
                            dirty: true,
                            ok: undefined,
                            err: undefined,
                          })
                        }
                        placeholder="/cards/organs/cerebellum.png"
                      />
                      <div className="ec-hint">
                        Tip: Use paths from <code>public/</code>, e.g. <code>/cards/organs/...</code>
                      </div>
                    </div>
                  </div>

                  {(d.err || d.ok) && (
                    <div className={`ec-msg ${d.err ? "err" : "ok"}`}>
                      {d.err ? d.err : d.ok}
                    </div>
                  )}

                  <div className="ec-actions">
                    <button
                      className="ec-primary"
                      type="button"
                      disabled={d.saving || d.deleting}
                      onClick={() => save(c.id)}
                    >
                      {d.saving ? "Saving..." : "Save"}
                    </button>

                    <button
                      className="ec-danger"
                      type="button"
                      disabled={d.saving || d.deleting}
                      onClick={() => askDelete(c.id)}
                    >
                      {d.deleting ? "Deleting..." : "Delete"}
                    </button>

                    {d.dirty && <span className="ec-dirty">Unsaved changes</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {!filtered.length && (
            <div className="ec-empty">
              No cards match your filters.
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="ec-modal-backdrop">
          <div className="ec-modal">
            <div className="ec-modal-title">Delete card?</div>
            <div className="ec-modal-text">
              This will permanently remove the card from the database.
            </div>
            <div className="ec-modal-actions">
              <button className="ec-ghost" onClick={() => setConfirmOpen(false)} type="button">
                Cancel
              </button>
              <button className="ec-danger" onClick={doDelete} type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
