"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Folder, FolderTree, Plus } from "lucide-react";
import Link from "next/link";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { AppModal } from "@/components/ui/AppModal";

type ProductCategory = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  status: string;
};

type ProductCategoryNode = ProductCategory & {
  children: ProductCategoryNode[];
};

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set());
  const [addingParentId, setAddingParentId] = useState<string | "root" | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    const response = await fetch("/api/erp/products/categories", { headers: getAuthHeaders() });
    setCategories(response.ok ? await response.json() : []);
  }

  useEffect(() => {
    void fetch("/api/erp/products/categories", { headers: getAuthHeaders() })
      .then(async (response) => (response.ok ? ((await response.json()) as ProductCategory[]) : []))
      .then(setCategories);
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>, parentId: string | null) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/products/categories", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        parentId,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "კატეგორიის შექმნა ვერ მოხერხდა.");
      return;
    }

    event.currentTarget.reset();
    setAddingParentId(null);
    if (parentId) {
      setOpenCategoryIds((current) => new Set(current).add(parentId));
    }
    setMessage("კატეგორია დაემატა.");
    await loadCategories();
  }

  async function updateCategory(event: React.FormEvent<HTMLFormElement>, categoryId: string) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/erp/products/categories/${categoryId}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "კატეგორიის განახლება ვერ მოხერხდა.");
      return;
    }

    setEditingCategoryId(null);
    setMessage("კატეგორია განახლდა.");
    await loadCategories();
  }

  async function deleteCategory(categoryId: string) {
    setMessage("");
    setError("");
    setDeleteError("");

    const response = await fetch(`/api/erp/products/categories/${categoryId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const deleteError = data.message ?? "კატეგორიის წაშლა ვერ მოხერხდა.";
      setError(deleteError);
      setDeleteError(deleteError);
      return;
    }

    setDeleteTarget(null);
    setMessage("კატეგორია წაიშალა.");
    await loadCategories();
  }

  const tree = buildCategoryTree(categories);

  return (
    <CoreModuleShell activeRoute="/erp/products/categories" eyebrow="Catalog" title="კატეგორიები">
      <section className="grid gap-5">
        <div className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f0edff] text-[#5e5bff]">
              <FolderTree size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold">კატეგორიების ხე</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">{categories.length} კატეგორია</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#5e5bff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/20"
              onClick={() => setAddingParentId("root")}
              type="button"
            >
              <Plus size={16} />
              მთავარი
            </button>
          </div>
          {error ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p> : null}
          {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">{message}</p> : null}
          <div className="mt-5 grid gap-2">
            {addingParentId === "root" ? (
              <InlineCategoryForm
                label="მთავარი კატეგორია"
                onCancel={() => setAddingParentId(null)}
                onSubmit={(event) => createCategory(event, null)}
              />
            ) : null}
            {tree.length === 0 ? (
              <p className="rounded-2xl bg-[#fbfcff] px-4 py-8 text-center text-sm font-semibold text-slate-400">
                კატეგორიები ჯერ არ არის.
              </p>
            ) : (
              tree.map((category) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  onToggle={(categoryId) =>
                    setOpenCategoryIds((current) => {
                      const next = new Set(current);
                      if (next.has(categoryId)) next.delete(categoryId);
                      else next.add(categoryId);
                      return next;
                    })
                  }
                  openCategoryIds={openCategoryIds}
                  addingParentId={addingParentId}
                  editingCategoryId={editingCategoryId}
                  onAdd={(categoryId) => setAddingParentId(categoryId)}
                  onCancelAdd={() => setAddingParentId(null)}
                  onCancelEdit={() => setEditingCategoryId(null)}
                  onCreate={createCategory}
                  onEdit={(categoryId) => setEditingCategoryId(categoryId)}
                  onDelete={(category) => {
                    setDeleteError("");
                    setDeleteTarget(category);
                  }}
                  onUpdate={updateCategory}
                />
              ))
            )}
          </div>
        </div>
      </section>
      <AppModal
        actions={[
          {
            label: "გაუქმება",
            onClick: () => {
              setDeleteTarget(null);
              setDeleteError("");
            },
            tone: "muted",
          },
          {
            label: "წაშლა",
            onClick: () => {
              if (deleteTarget) void deleteCategory(deleteTarget.id);
            },
            tone: "danger",
          },
        ]}
        description={
          deleteTarget
            ? `კატეგორია "${deleteTarget.name}" წაიშლება მხოლოდ მაშინ, თუ მას არაფერი აქვს მიბმული.`
            : undefined
        }
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        open={Boolean(deleteTarget)}
        title={deleteError ? "კატეგორია ვერ წაიშალა" : "კატეგორიის წაშლა"}
        tone={deleteError ? "warning" : "danger"}
      >
        {deleteError ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-700">{deleteError}</p>
        ) : (
          <p>თუ კატეგორიას ქვე კატეგორია ან პროდუქტი აქვს მიბმული, სისტემა ავტომატურად დაბლოკავს წაშლას.</p>
        )}
      </AppModal>
    </CoreModuleShell>
  );
}

function CategoryTreeItem({
  addingParentId,
  category,
  editingCategoryId,
  onAdd,
  onCancelAdd,
  onCancelEdit,
  onCreate,
  onDelete,
  onEdit,
  onToggle,
  onUpdate,
  openCategoryIds,
}: {
  addingParentId: string | "root" | null;
  category: ProductCategoryNode;
  editingCategoryId: string | null;
  onAdd: (categoryId: string) => void;
  onCancelAdd: () => void;
  onCancelEdit: () => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>, parentId: string | null) => void;
  onDelete: (category: ProductCategoryNode) => void;
  onEdit: (categoryId: string) => void;
  onToggle: (categoryId: string) => void;
  onUpdate: (event: React.FormEvent<HTMLFormElement>, categoryId: string) => void;
  openCategoryIds: Set<string>;
}) {
  const hasChildren = category.children.length > 0;
  const isOpen = openCategoryIds.has(category.id);
  const isAddingChild = addingParentId === category.id;
  const isEditing = editingCategoryId === category.id;

  return (
    <div>
      <div className={category.level === 1 ? "flex items-center gap-2 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-3 py-2" : "flex items-center gap-2 rounded-2xl px-3 py-2 hover:bg-[#fbfcff]"}>
        <button
          className={hasChildren ? "grid size-8 place-items-center rounded-xl bg-white text-slate-800 shadow-sm hover:bg-[#f0edff] hover:text-[#5e5bff]" : "size-8"}
          disabled={!hasChildren}
          onClick={() => onToggle(category.id)}
          type="button"
        >
          {hasChildren ? <ChevronDown className={isOpen ? "rotate-180 transition" : "transition"} size={15} /> : null}
        </button>
        <span className={category.level === 1 ? "grid size-9 place-items-center rounded-xl bg-white text-[#5e5bff] shadow-sm" : "grid size-8 place-items-center rounded-xl bg-[#f0edff] text-[#5e5bff]"}>
          <Folder size={category.level === 1 ? 17 : 15} />
        </span>
        {isEditing ? (
          <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(event) => onUpdate(event, category.id)}>
            <input
              className="min-w-0 flex-1 rounded-xl border border-[#5e5bff]/25 bg-white px-3 py-2 text-sm font-bold outline-none"
              defaultValue={category.name}
              name="name"
              required
            />
            <TextButton label="შენახვა" type="submit" />
            <TextButton label="გაუქმება" onClick={onCancelEdit} tone="muted" />
          </form>
        ) : (
          <Link className="min-w-0 flex-1 hover:text-[#5e5bff]" href={`/erp/products?category=${category.id}`}>
            <span className="block truncate text-sm font-black text-slate-800">{category.name}</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{parentPath(category.path)}</span>
          </Link>
        )}
        <span className={category.level === 1 ? "rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#5e5bff]" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"}>
          L{category.level}
        </span>
        {hasChildren ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
            {category.children.length}
          </span>
        ) : null}
        {!isEditing ? (
          <div className="flex items-center gap-1">
            <TextButton label="ქვე კატეგორიის დამატება" onClick={() => onAdd(category.id)} />
            <TextButton label="რედაქტირება" onClick={() => onEdit(category.id)} tone="muted" />
            <TextButton label="წაშლა" onClick={() => onDelete(category)} tone="danger" />
          </div>
        ) : null}
      </div>
      {isAddingChild ? (
        <div className="ml-8 mt-2 border-l-2 border-[#e8e9ff] pl-4">
          <InlineCategoryForm
            label={`${category.name} ქვეშ`}
            onCancel={onCancelAdd}
            onSubmit={(event) => onCreate(event, category.id)}
          />
        </div>
      ) : null}
      {hasChildren && isOpen ? (
        <div className="ml-8 mt-2 grid gap-2 border-l-2 border-[#e8e9ff] pl-4">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              addingParentId={addingParentId}
              category={child}
              editingCategoryId={editingCategoryId}
              onAdd={onAdd}
              onCancelAdd={onCancelAdd}
              onCancelEdit={onCancelEdit}
              onCreate={onCreate}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggle={onToggle}
              onUpdate={onUpdate}
              openCategoryIds={openCategoryIds}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InlineCategoryForm({
  label,
  onCancel,
  onSubmit,
}: {
  label: string;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#5e5bff]/15 bg-[#f0edff] p-2" onSubmit={onSubmit}>
      <input
        className="min-w-0 flex-1 rounded-xl border border-white bg-white px-3 py-2 text-sm font-bold outline-none"
        name="name"
        placeholder={label}
        required
      />
      <TextButton label="შენახვა" type="submit" />
      <TextButton label="გაუქმება" onClick={onCancel} tone="muted" />
    </form>
  );
}

function TextButton({
  label,
  onClick,
  tone = "primary",
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  tone?: "primary" | "muted" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={
        tone === "primary"
          ? "shrink-0 rounded-xl bg-[#5e5bff] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-[#6857ff]/15"
          : tone === "danger"
            ? "shrink-0 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-500 shadow-sm hover:bg-rose-50"
            : "shrink-0 rounded-xl border border-indigo-950/8 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm hover:text-[#5e5bff]"
      }
      onClick={onClick}
      title={label}
      type={type}
    >
      {label}
    </button>
  );
}

function parentPath(path: string) {
  const parts = path.split(" / ");
  if (parts.length <= 1) return "მთავარი კატეგორია";
  return parts.slice(0, -1).join(" / ");
}

function buildCategoryTree(categories: ProductCategory[]) {
  const byId = new Map<string, ProductCategoryNode>();
  for (const category of categories) byId.set(category.id, { ...category, children: [] });

  const roots: ProductCategoryNode[] = [];
  for (const category of byId.values()) {
    if (category.parentId && byId.has(category.parentId)) byId.get(category.parentId)?.children.push(category);
    else roots.push(category);
  }

  const sortTree = (nodes: ProductCategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ka"));
    for (const node of nodes) sortTree(node.children);
  };
  sortTree(roots);
  return roots;
}
