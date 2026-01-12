import React from 'react';

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'file' | 'checkbox';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select and radio
}

interface DynamicFormRendererProps {
  fields: FormField[];
  submitButtonText?: string;
  readOnly?: boolean;
  onSubmit?: (data: any) => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ fields, submitButtonText = "Gönder", readOnly = false, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly) return;
    if (onSubmit) {
      const formData = new FormData(e.currentTarget);
      const data: any = {};
      fields.forEach(field => {
        const value = formData.get(field.id);
        // Store with both field.id and field.label for compatibility
        data[field.id] = value;
        data[field.label] = value;
      });
      onSubmit(data);
    }
  };

  const renderField = (field: FormField) => {
    const commonClasses = "w-full h-12 rounded-lg border-border-color bg-background-light dark:bg-background-dark dark:border-gray-700 dark:text-white px-4 text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.id}
            className="w-full rounded-lg border-border-color bg-background-light dark:bg-background-dark dark:border-gray-700 dark:text-white p-4 text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-y min-h-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={field.placeholder}
            required={field.required}
            disabled={readOnly}
          />
        );
      case 'select':
        return (
          <div className="relative">
            <select name={field.id} className={`${commonClasses} appearance-none cursor-pointer`} required={field.required} disabled={readOnly}>
              <option value="">Seçiniz</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        );
      case 'radio':
        return (
          <div className="flex flex-col gap-2 mt-2">
            {field.options?.map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 cursor-pointer group ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="relative flex items-center">
                  <input type="radio" name={field.id} value={opt} className="peer sr-only" required={field.required} disabled={readOnly} />
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center scale-0 peer-checked:scale-100 transition-transform">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <span className="text-text-main dark:text-gray-300 group-hover:text-primary transition-colors">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'file':
        return (
          <div className={`relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center transition-colors group ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer'}`}>
            <input type="file" name={field.id} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={field.required} disabled={readOnly} />
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              <span className="text-sm font-medium">{field.placeholder || "Dosya yüklemek için tıklayın veya sürükleyin"}</span>
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <label className={`flex items-center gap-3 cursor-pointer group select-none mt-2 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
            <div className="relative flex items-center">
              <input type="checkbox" name={field.id} className="peer sr-only" required={field.required} disabled={readOnly} />
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm scale-0 peer-checked:scale-100 transition-transform">check</span>
              </div>
            </div>
            <span className="text-text-main dark:text-gray-300 font-medium group-hover:text-primary transition-colors">{field.placeholder || "Onaylıyorum"}</span>
          </label>
        );
      default: // text, number, email, tel, date
        return (
          <input
            type={field.type}
            name={field.id}
            className={commonClasses}
            placeholder={field.placeholder}
            required={field.required}
            disabled={readOnly}
            lang="tr" // Force Turkish locale for date inputs
          />
        );
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.id} className="flex flex-col gap-2">
          <span className="text-sm font-bold text-text-main dark:text-gray-300 flex justify-between">
            {field.label}
            {field.required && !readOnly && <span className="text-secondary text-xs">* Zorunlu</span>}
          </span>
          {renderField(field)}
        </label>
      ))}

      {/* Show submit button only if not read-only, or show disabled/hidden state if preferred */}
      {!readOnly && (
        <div className="pt-4">
          <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <span>{submitButtonText}</span>
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
          <p className="text-xs text-text-muted dark:text-gray-500 mt-4 text-center">
            Göndererek <a className="underline hover:text-primary" href="#">KVKK Aydınlatma Metni</a>ni kabul etmiş olursunuz.
          </p>
        </div>
      )}
      {readOnly && (
        <div className="pt-4 opacity-50 cursor-not-allowed">
          <button type="button" disabled className="w-full bg-gray-400 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
            <span>Form Gösterim Modu (Devre Dışı)</span>
            <span className="material-symbols-outlined text-sm">lock</span>
          </button>
        </div>
      )}
    </form>
  );
};

export default DynamicFormRenderer;