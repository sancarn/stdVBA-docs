import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

// Core interfaces
interface IBaseItem {
  name: string;
  description?: string;
  remarks?: string[];
  examples?: string[];
  devNotes?: string[];
  todos?: string[];
  requires?: string[];
}

interface IMember extends IBaseItem {
  params?: IParam[];
  returns?: IReturn;
  throws?: IThrow[];
  isStatic?: boolean;
  isProtected?: boolean;
  isDefaultMember?: boolean;
  deprecation?: {
    status: boolean;
    message: string;
  };
}

interface IParam {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
  paramArray?: boolean;
}

interface IReturn {
  type: string;
  description?: string;
}

interface IThrow {
  errNumber: number;
  errText: string;
}

interface IProperty extends IMember {
  access: 'ReadWrite' | 'ReadOnly' | 'WriteOnly';
}

interface IMethod extends IMember {}

interface IConstructor extends IMember {}

interface IEvent extends IBaseItem {
  params?: IParam[];
  isProtected?: boolean;
}

interface IFunction extends IMember {}

interface IClass extends IBaseItem {
  fileName?: string;
  implements?: string[];
  constructors: IConstructor[];
  properties: IProperty[];
  methods: IMethod[];
  events: IEvent[];
}

interface IModule extends IBaseItem {
  fileName?: string;
  functions: IFunction[];
}

interface IData {
  classes: IClass[];
  modules: IModule[];
}

// Component interfaces
interface StringListProps {
  title: string;
  items?: string[];
}

interface CodeExampleProps {
  code: string;
}

interface MemberCommonDetailsProps {
  item: IBaseItem;
}

interface ThrowsDetailProps {
  throws: IThrow[];
}

interface ParametersDetailProps {
  params: IParam[];
}

interface ReturnsDetailProps {
  returns: IReturn;
}

interface PropertyDetailProps {
  property: IProperty;
  id: string;
  highlight?: boolean;
  parentName: string;
}

interface MethodConstructorDetailProps {
  method: IMethod | IConstructor;
  id: string;
  highlight?: boolean;
  parentName: string;
}

interface EventDetailProps {
  event: IEvent;
  id: string;
  highlight?: boolean;
  parentName: string;
}

interface FunctionDetailProps {
  func: IFunction;
  id: string;
  highlight?: boolean;
  parentName: string;
}

interface OnThisPagePanelProps {
  selectedItem: IClass | IModule | undefined;
  mainContentRef: React.RefObject<HTMLDivElement>;
  devMode: boolean;
  highlightedMember?: string | null;
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match && (match[1] === 'vb' || match[1] === 'vba') ? 'vbnet' : match ? match[1] : undefined;
    if (inline) {
      return <code className="bg-gray-800 text-green-300 px-1 rounded font-mono text-sm" {...props}>{children}</code>;
    }
    return !inline && lang ? (
      <SyntaxHighlighter
        style={oneDark}
        language={lang}
        PreTag="div"
        customStyle={{ background: 'none', padding: 0, margin: 0 }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  inlineCode({ children, ...props }: any) {
    return (
      <code className="bg-gray-800 text-green-300 px-1 rounded font-mono text-sm" {...props}>
        {children}
      </code>
    );
  }
};

// Reusable component for displaying lists of strings (remarks, dev notes, todos, requires)
const StringList = ({ title, items = [] }: StringListProps) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-200 mb-2">{title}:</h4>
      <ul className="list-disc list-inside text-gray-300">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

// Reusable component for displaying code examples as preformatted text
const CodeExample = ({ code }: CodeExampleProps) => {
  const codeString = typeof code === 'string' ? code : String(code || '');
  return (
    <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-auto my-2 shadow-inner">
      <code className="language-vba">
        {codeString}
      </code>
    </pre>
  );
};

// Component to display general details for methods, properties, constructors, functions, events
const MemberCommonDetails = ({ item }: MemberCommonDetailsProps) => (
  <>
    {item.description && (
      <div className="prose prose-invert text-gray-300 mb-2">
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
      </div>
    )}
    {item.remarks && item.remarks.length > 0 && (
      <div className="mt-4">
        <h4 className="text-lg font-medium text-gray-200 mb-2">Remarks:</h4>
        {item.remarks.map((remark, idx) => (
          <div key={idx} className="mb-2 prose prose-invert">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{remark}</ReactMarkdown>
          </div>
        ))}
      </div>
    )}
    {item.examples && item.examples.length > 0 && (
      <div className="mt-4">
        <h4 className="text-lg font-medium text-gray-200 mb-2">Examples:</h4>
        {item.examples.map((example, index) => (
          <div key={index} className="my-2 prose prose-invert text-green-300 rounded-md p-4 font-mono text-sm">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{example}</ReactMarkdown>
          </div>
        ))}
      </div>
    )}
    {item.devNotes && <StringList title="Dev Notes" items={item.devNotes} />}
    {item.todos && <StringList title="TODOs" items={item.todos} />}
    {item.requires && <StringList title="Requires" items={item.requires} />}
  </>
);

// Component to display IThrows details
const ThrowsDetail = ({ throws }: ThrowsDetailProps) => {
  if (!Array.isArray(throws) || throws.length === 0) return null;
  return (
    
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-200 mb-2">Throws:</h4>
      <ul className="list-disc list-inside text-gray-300 ml-4">
        {throws.map((err, index) => (
          <li key={index} className="mb-1">
            <span className="font-medium text-red-300">Error {err.errNumber}:</span> {err.errText}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component to display IParam details
const ParametersDetail = ({ params }: ParametersDetailProps) => {
  if (!Array.isArray(params) || params.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-200 mb-2">Parameters:</h4>
      <ul className="list-disc list-inside text-gray-300 ml-4">
        {params.map((param, idx) => (
          <li key={idx} className="mb-1">
            <span className="font-medium text-purple-300">{String(param.name)}</span>: {String(param.type)}
            {param.optional && <span className="text-gray-400"> (Optional)</span>}
            {param.defaultValue && <span className="text-gray-400"> = {String(param.defaultValue)}</span>}
            {param.paramArray && <span className="text-gray-400"> (ParamArray)</span>}
            <br />
            {param.description && (
              <span className="ml-4 text-sm italic prose prose-invert">
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{param.description}</ReactMarkdown>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component to display IReturn details
const ReturnsDetail = ({ returns }: ReturnsDetailProps) => {
  if (!returns || !returns.type) return null;
  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-200 mb-2">Returns:</h4>
      <p className="text-gray-300 ml-4">
        <span className="font-medium text-purple-300">Type:</span> {String(returns.type)}
        {returns.description && <span className="ml-2">- {String(returns.description)}</span>}
      </p>
    </div>
  );
};

// Utility for copying link
function useCopyLink() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };
  return { copied, copy };
}

// Component to display an IProperty
const PropertyDetail = ({ property, id, highlight, parentName }: PropertyDetailProps) => {
  const { copied, copy } = useCopyLink();
  const [hovered, setHovered] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?q=${parentName}.${property.name}` : '';
  return (
    <div
      id={id}
      className={`mb-6 p-4 bg-gray-700 rounded-md shadow-md ${highlight ? 'border-2 border-teal-400' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex items-center">
          {copied === id && (
            <span className="absolute -left-8 text-xs text-green-400 bg-gray-800 px-2 py-1 rounded shadow">Copied!</span>
          )}
        </span>
        <button
          className="text-xl font-semibold text-teal-400 hover:underline hover:text-teal-300 transition-colors duration-150 focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ appearance: 'none' }}
          onClick={() => copy(url, id)}
          title="Copy link to this item"
        >
          {String(property.name)}
        </button>
        <span className="ml-2 text-sm text-gray-400 font-normal">({property.access})</span>
        {property.deprecation && property.deprecation.status && (
          <span className="ml-2 text-sm text-red-400 font-normal"> (Deprecated: {property.deprecation.message})</span>
        )}
      </div>
      <MemberCommonDetails item={property} />
      <ParametersDetail params={property.params || []} />
      <ReturnsDetail returns={property.returns || { type: 'Variant', description: '' }} />
      <ThrowsDetail throws={property.throws || []} />
    </div>
  );
};

// Component to display an IMethod or IConstructor
const MethodConstructorDetail = ({ method, id, highlight, parentName }: MethodConstructorDetailProps) => {
  const { copied, copy } = useCopyLink();
  const [hovered, setHovered] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?q=${parentName}.${method.name}` : '';
  return (
    <div
      id={id}
      className={`mb-6 p-4 bg-gray-700 rounded-md shadow-md ${highlight ? 'border-2 border-teal-400' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex items-center">
          {copied === id && (
            <span className="absolute -left-8 text-xs text-green-400 bg-gray-800 px-2 py-1 rounded shadow">Copied!</span>
          )}
        </span>
        <button
          className="text-xl font-semibold text-teal-400 hover:underline hover:text-teal-300 transition-colors duration-150 focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ appearance: 'none' }}
          onClick={() => copy(url, id)}
          title="Copy link to this item"
        >
          {String(method.name)}
        </button>
        {method.isStatic && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Static)</span>}
        {method.isProtected && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Protected)</span>}
        {method.isDefaultMember && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Default Member)</span>}
        {method.deprecation && method.deprecation.status && (
          <span className="ml-2 text-sm text-red-400 font-normal"> (Deprecated: {method.deprecation.message})</span>
        )}
      </div>
      <MemberCommonDetails item={method} />
      <ParametersDetail params={method.params || []} />
      <ReturnsDetail returns={method.returns || { type: 'Variant', description: '' }} />
      <ThrowsDetail throws={method.throws || []} />
    </div>
  );
};

// Component to display an IEvent
const EventDetail = ({ event, id, highlight, parentName }: EventDetailProps) => {
  const { copied, copy } = useCopyLink();
  const [hovered, setHovered] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?q=${parentName}.${event.name}` : '';
  return (
    <div
      id={id}
      className={`mb-6 p-4 bg-gray-700 rounded-md shadow-md ${highlight ? 'border-2 border-teal-400' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex items-center">
          {copied === id && (
            <span className="absolute -left-8 text-xs text-green-400 bg-gray-800 px-2 py-1 rounded shadow">Copied!</span>
          )}
        </span>
        <button
          className="text-xl font-semibold text-teal-400 hover:underline hover:text-teal-300 transition-colors duration-150 focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ appearance: 'none' }}
          onClick={() => copy(url, id)}
          title="Copy link to this item"
        >
          {String(event.name)}
        </button>
      </div>
      <MemberCommonDetails item={event} />
      <ParametersDetail params={event.params || []} />
    </div>
  );
};

// Component to display an IFunction (from IModule)
const FunctionDetail = ({ func, id, highlight, parentName }: FunctionDetailProps) => {
  const { copied, copy } = useCopyLink();
  const [hovered, setHovered] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?q=${parentName}.${func.name}` : '';
  return (
    <div
      id={id}
      className={`mb-6 p-4 bg-gray-700 rounded-md shadow-md ${highlight ? 'border-2 border-teal-400' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex items-center">
          {copied === id && (
            <span className="absolute -left-8 text-xs text-green-400 bg-gray-800 px-2 py-1 rounded shadow">Copied!</span>
          )}
        </span>
        <button
          className="text-xl font-semibold text-teal-400 hover:underline hover:text-teal-300 transition-colors duration-150 focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ appearance: 'none' }}
          onClick={() => copy(url, id)}
          title="Copy link to this item"
        >
          {String(func.name)}
        </button>
        {func.isStatic && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Static)</span>}
        {func.isProtected && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Protected)</span>}
        {func.isDefaultMember && <span className="ml-2 text-sm text-yellow-400 font-normal"> (Default Member)</span>}
        {func.deprecation && func.deprecation.status && (
          <span className="ml-2 text-sm text-red-400 font-normal"> (Deprecated: {func.deprecation.message})</span>
        )}
      </div>
      <MemberCommonDetails item={func} />
      <ParametersDetail params={func.params || []} />
      <ReturnsDetail returns={func.returns || { type: 'Variant', description: '' }} />
      <ThrowsDetail throws={func.throws || []} />
    </div>
  );
};

// Component for the "On This Page" navigation panel
const OnThisPagePanel = ({ selectedItem, mainContentRef, devMode, highlightedMember }: OnThisPagePanelProps) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    const mainContent = mainContentRef.current;

    console.log(`Attempting to scroll to element with ID: ${id}`);
    console.log("Found element:", element);
    console.log("Main content element from ref:", mainContent);

    if (element && mainContent) {
      const elementRect = element.getBoundingClientRect();
      const mainContentRect = mainContent.getBoundingClientRect();
      const relativeTop = elementRect.top - mainContentRect.top;
      const targetScrollTop = mainContent.scrollTop + relativeTop;
      const offset = 20;

      mainContent.scrollTo({
        top: targetScrollTop - offset,
        behavior: 'smooth'
      });
      console.log(`Scrolled main content to element ${id} at top: ${targetScrollTop - offset}`);
    } else {
      console.log(`Element with ID: ${id} or main content ref not found.`);
    }
  };

  if (!selectedItem) {
    return null;
  }

  const members: Array<{ type: string; name: string; id?: string; member?: any }> = [];

  // Helper to check if a member is protected
  function isProtectedMember(member: any, type: string) {
    if (type === 'constructor' || type === 'method' || type === 'property' || type === 'event') {
      return member && member.isProtected;
    }
    return false;
  }

  // Populate sections for Class
  if ('constructors' in selectedItem && selectedItem.constructors.length > 0) {
    members.push({ type: 'header', name: 'Constructors', id: 'constructors-section' });
    (devMode
      ? selectedItem.constructors
      : selectedItem.constructors.filter((c: IConstructor) => !c.isProtected)
    ).forEach((m: IConstructor) => members.push({ type: 'constructor', name: m.name, member: m }));
  }
  if ('properties' in selectedItem && selectedItem.properties.length > 0) {
    members.push({ type: 'header', name: 'Properties', id: 'properties-section' });
    (devMode
      ? selectedItem.properties
      : selectedItem.properties.filter((p: IProperty) => !p.isProtected)
    ).forEach((p: IProperty) => members.push({ type: 'property', name: p.name, member: p }));
  }
  if ('methods' in selectedItem && selectedItem.methods.length > 0) {
    members.push({ type: 'header', name: 'Methods', id: 'methods-section' });
    (devMode
      ? selectedItem.methods
      : selectedItem.methods.filter((m: IMethod) => !m.isProtected)
    ).forEach((m: IMethod) => members.push({ type: 'method', name: m.name, member: m }));
  }
  if ('events' in selectedItem && selectedItem.events.length > 0) {
    members.push({ type: 'header', name: 'Events', id: 'events-section' });
    (devMode
      ? selectedItem.events
      : selectedItem.events.filter((e: IEvent) => !e.isProtected)
    ).forEach((e: IEvent) => members.push({ type: 'event', name: e.name, member: e }));
  }

  // Populate sections for Module (only functions)
  if ('functions' in selectedItem && selectedItem.functions.length > 0) {
    members.push({ type: 'header', name: 'Functions', id: 'functions-section' });
    selectedItem.functions.forEach((f: IFunction) => members.push({ type: 'function', name: f.name }));
  }

  return (
    <div className="p-6"> {/* Reverted to p-6 for consistent padding */}
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">On This Page</h2>

      <ul className="space-y-2">
        {members.map((member, index) => {
          if (member.type === 'header') {
            return (
              <li key={member.id || index} className="pt-2">
                <button
                  onClick={() => scrollToSection(member.id || '')}
                  className="w-full text-left font-semibold text-gray-300 hover:text-blue-400 focus:outline-none text-lg"
                >
                  {member.name}
                </button>
              </li>
            );
          } else {
            const memberId = member.name.replace(/\s+/g, '-') + '-detail';
            let icon = '';
            let iconBgColor = '';

            switch (member.type) {
              case 'constructor':
                icon = 'C';
                iconBgColor = 'bg-blue-600';
                break;
              case 'property':
                icon = 'P';
                iconBgColor = 'bg-orange-600';
                break;
              case 'method':
                icon = 'M';
                iconBgColor = 'bg-pink-600';
                break;
              case 'function':
                icon = 'F';
                iconBgColor = 'bg-green-600';
                break;
              case 'event':
                icon = 'E';
                iconBgColor = 'bg-purple-600';
                break;
              default:
                icon = '?';
                iconBgColor = 'bg-gray-500';
            }

            const isProtected = devMode && isProtectedMember(member.member, member.type);
            const highlight = highlightedMember && member.name === highlightedMember;
            return (
              <li key={memberId} className={`ml-4 ${isProtected ? 'opacity-50 italic' : ''} ${highlight ? 'border-2 border-teal-400' : ''}`}>
                <button
                  onClick={() => scrollToSection(memberId)}
                  className={`w-full text-left text-sm text-gray-200 hover:text-teal-400 focus:outline-none flex items-center ${isProtected ? 'pointer-events-none' : ''}`}
                  tabIndex={isProtected ? -1 : 0}
                  aria-disabled={isProtected ? 'true' : undefined}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 ${iconBgColor} rounded-full text-sm font-bold text-white mr-2 leading-none flex-shrink-0`}>{icon}</span>
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis">{member.name}</span>
                </button>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
};

function App() {
  const [selectedItem, setSelectedItem] = useState<{ type: 'class' | 'module'; name: string } | null>(null);
  const [data, setData] = useState<IData>({ classes: [], modules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // State for desktop panel minimization
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
  const [isRightPanelMinimized, setIsRightPanelMinimized] = useState(false);

  // State for mobile panel visibility (overlay)
  const [isLeftPanelOpenMobile, setIsLeftPanelOpenMobile] = useState(false);
  const [isRightPanelOpenMobile, setIsRightPanelOpenMobile] = useState(false);

  // Dev/User mode toggle
  const [devMode, setDevMode] = useState(false);
  const handleToggleMode = () => setDevMode((prev) => !prev);

  // Toggle functions for desktop panel minimization
  const toggleLeftPanelDesktop = () => setIsLeftPanelMinimized(prev => !prev);
  const toggleRightPanelDesktop = () => setIsRightPanelMinimized(prev => !prev);

  // Toggle functions for mobile panel overlay
  const openLeftPanelMobile = () => {
    setIsLeftPanelOpenMobile(true);
    setIsRightPanelOpenMobile(false); // Ensure only one mobile panel is open at a time
  };

  const openRightPanelMobile = () => {
    setIsRightPanelOpenMobile(true);
    setIsLeftPanelOpenMobile(false); // Ensure only one mobile panel is open at a time
  };

  const closeMobilePanels = () => {
    setIsLeftPanelOpenMobile(false);
    setIsRightPanelOpenMobile(false);
  };

  const [highlightedMember, setHighlightedMember] = useState<string | null>(null);

  // URL parameter support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && data.classes.length + data.modules.length > 0) {
      const [itemName, memberName] = q.split('.');
      let found = false;
      const cls = data.classes.find(c => c.name === itemName);
      if (cls) {
        setSelectedItem({ type: 'class', name: cls.name });
        found = true;
        if (memberName) {
          setHighlightedMember(memberName);
          setTimeout(() => {
            const el = document.getElementById(memberName.replace(/\s+/g, '-') + '-detail');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      }
      if (!found) {
        const mod = data.modules.find(m => m.name === itemName);
        if (mod) {
          setSelectedItem({ type: 'module', name: mod.name });
          if (memberName) {
            setHighlightedMember(memberName);
            setTimeout(() => {
              const el = document.getElementById(memberName.replace(/\s+/g, '-') + '-detail');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          }
        }
      }
    } else {
      setHighlightedMember(null);
    }
    // eslint-disable-next-line
  }, [data.classes, data.modules]);

  useEffect(() => {
    // Reset minimization states on desktop to ensure full visibility
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint in Tailwind is 768px
        setIsLeftPanelMinimized(false); // Always expanded on desktop
        setIsRightPanelMinimized(false); // Always expanded on desktop
        setIsLeftPanelOpenMobile(false); // Ensure mobile panels are closed
        setIsRightPanelOpenMobile(false); // Ensure mobile panels are closed
      } else {
        // On mobile, default to minimized/closed states
        setIsLeftPanelMinimized(true); // Visual state for desktop toggle, but hidden by default on mobile
        setIsRightPanelMinimized(true); // Visual state for desktop toggle, but hidden by default on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const response = await fetch('https://raw.githack.com/sancarn/stdVBA/master/docs.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log("Fetched Raw JSON Data (New Structure):", jsonData);

        const classes: IClass[] = [];
        const modules: IModule[] = [];

        if (Array.isArray(jsonData)) {
          jsonData.forEach(item => {
            const isClass = item.constructors !== undefined || item.events !== undefined;

            if (isClass) {
              const currentClass: IClass = {
                name: item.name,
                fileName: item.fileName || '',
                description: item.description || '',
                remarks: item.remarks || [],
                examples: item.examples || [],
                devNotes: item.devNotes || [],
                todos: item.todos || [],
                requires: item.requires || [],
                implements: item.implements || [],
                constructors: [],
                methods: [],
                properties: [],
                events: []
              };

              if (Array.isArray(item.constructors)) {
                item.constructors.forEach((ctor: any) => {
                  currentClass.constructors.push({
                    name: ctor.name,
                    description: ctor.description || '',
                    remarks: ctor.remarks || [],
                    examples: ctor.examples || [],
                    params: ctor.params || [],
                    returns: ctor.returns || { type: 'Variant', description: '' },
                    devNotes: ctor.devNotes || [],
                    todos: ctor.todos || [],
                    throws: ctor.throws || [],
                    requires: ctor.requires || [],
                    isStatic: ctor.isStatic || false,
                    isProtected: ctor.isProtected || false,
                    isDefaultMember: ctor.isDefaultMember || false,
                    deprecation: ctor.deprecation || { status: false, message: '' }
                  });
                });
              }

              if (Array.isArray(item.properties)) {
                item.properties.forEach((prop: any) => {
                  currentClass.properties.push({
                    name: prop.name,
                    description: prop.description || '',
                    remarks: prop.remarks || [],
                    examples: prop.examples || [],
                    params: prop.params || [],
                    returns: prop.returns || { type: 'Variant', description: '' },
                    devNotes: prop.devNotes || [],
                    todos: prop.todos || [],
                    throws: prop.throws || [],
                    requires: prop.requires || [],
                    isStatic: prop.isStatic || false,
                    isProtected: prop.isProtected || false,
                    isDefaultMember: prop.isDefaultMember || false,
                    deprecation: prop.deprecation || { status: false, message: '' },
                    access: prop.access || 'ReadWrite'
                  });
                });
              }

              if (Array.isArray(item.methods)) {
                item.methods.forEach((method: any) => {
                  currentClass.methods.push({
                    name: method.name,
                    description: method.description || '',
                    remarks: method.remarks || [],
                    examples: method.examples || [],
                    params: method.params || [],
                    returns: method.returns || { type: 'Variant', description: '' },
                    devNotes: method.devNotes || [],
                    todos: method.todos || [],
                    throws: method.throws || [],
                    requires: method.requires || [],
                    isStatic: method.isStatic || false,
                    isProtected: method.isProtected || false,
                    isDefaultMember: method.isDefaultMember || false,
                    deprecation: method.deprecation || { status: false, message: '' }
                  });
                });
              }

              if (Array.isArray(item.events)) {
                item.events.forEach((event: any) => {
                  currentClass.events.push({
                    name: event.name,
                    description: event.description || '',
                    remarks: event.remarks || [],
                    examples: event.examples || [],
                    params: event.params || [],
                    devNotes: event.devNotes || [],
                    todos: event.todos || [],
                    requires: event.requires || [],
                    isProtected: event.isProtected || false
                  });
                });
              }
              classes.push(currentClass);
            } else {
              const currentModule: IModule = {
                name: item.name,
                fileName: item.fileName || '',
                description: item.description || '',
                remarks: item.remarks || [],
                examples: item.examples || [],
                devNotes: item.devNotes || [],
                todos: item.todos || [],
                requires: item.requires || [],
                functions: []
              };

              if (Array.isArray(item.methods)) {
                item.methods.forEach((func: any) => {
                  currentModule.functions.push({
                    name: func.name,
                    description: func.description || '',
                    remarks: func.remarks || [],
                    examples: func.examples || [],
                    params: func.params || [],
                    returns: func.returns || { type: 'Variant', description: '' },
                    devNotes: func.devNotes || [],
                    todos: func.todos || [],
                    throws: func.throws || [],
                    requires: func.requires || [],
                    isStatic: func.isStatic || false,
                    isProtected: func.isProtected || false,
                    isDefaultMember: func.isDefaultMember || false,
                    deprecation: func.deprecation || { status: false, message: '' }
                  });
                });
              }
              modules.push(currentModule);
            }
          });
        }
        setData({ classes, modules });
      } catch (err) {
        console.error("Could not fetch documentation data:", err);
        setError("Failed to load documentation. Please try again later. Check console for details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentation();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-gray-300">
          <p className="text-xl">Loading documentation...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center text-red-500">
          <p className="text-xl">{error}</p>
          <p className="text-lg mt-2">Please check your browser's console for more details on the data structure if classes/modules are not showing.</p>
        </div>
      );
    }

    if (!selectedItem) {
      return (
        <div className="p-8 text-gray-300">
          <div className="mb-6 flex items-center gap-4">
            <span className="font-semibold text-lg">Mode:</span>
            <button
              onClick={handleToggleMode}
              className={`px-4 py-2 rounded-lg font-bold transition-colors duration-200 focus:outline-none shadow-md
                ${devMode ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white'}`}
            >
              {devMode ? 'Dev mode' : 'User mode'}
            </button>
          </div>
          <h2 className="text-4xl font-bold text-blue-400 mb-4">Welcome to stdVBA Documentation</h2>
          <p className="text-lg">Select a class or module from the sidebar to view its documentation.</p>
          <p className="mt-4">This documentation provides details on VBA classes, properties, methods, and functions, including parameters and code examples.</p>
          <div className="mt-8 p-6 bg-gray-800 rounded-md shadow-lg">
            <h3 className="text-2xl font-semibold text-green-400 mb-3">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-300 text-lg">
              <li className="mb-2">Comprehensive details for Classes and Modules.</li>
              <li className="mb-2">Clear descriptions of Properties, Methods, and Functions.</li>
                <li className="mb-2">Detailed parameter and return type information.</li>
                <li className="mb-2">Practical code examples for quick understanding.</li>
              </ul>
            </div>

            {/* <ReactMarkdown components={markdownComponents}>
              {"```vb\r\nDim x as Long: x = 10\r\n```"}
            </ReactMarkdown> */}
          </div>
        );
      }

      switch (selectedItem.type) {
        case 'class':
          const selectedClass = data.classes.find(c => c.name === selectedItem.name);
          if (!selectedClass) return <div className="p-8 text-red-400">Class not found.</div>;
          // Filter all member types for user mode
          const visibleConstructors = devMode
            ? selectedClass.constructors
            : selectedClass.constructors.filter(c => !c.isProtected);
          const visibleMethods = devMode
            ? selectedClass.methods
            : selectedClass.methods.filter(m => !m.isProtected);
          const visibleProperties = devMode
            ? selectedClass.properties
            : selectedClass.properties.filter(p => !p.isProtected);
          const visibleEvents = devMode
            ? selectedClass.events
            : selectedClass.events.filter(e => !e.isProtected);
          return (
            <div className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <span className="font-semibold text-lg">Mode:</span>
                <button
                  onClick={handleToggleMode}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors duration-200 focus:outline-none shadow-md
                    ${devMode ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white'}`}
                >
                  {devMode ? 'Dev mode' : 'User mode'}
                </button>
              </div>
              <h2 className="text-4xl font-bold text-blue-400 mb-4 rounded-md p-2 bg-gray-800 shadow-lg">{String(selectedClass.name)}</h2>
              <p className="text-lg text-gray-300 mb-6">
                <span className="prose prose-invert">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{selectedClass.description || ''}</ReactMarkdown>
                </span>
              </p>

              <StringList title="Remarks" items={selectedClass.remarks} />
              {Array.isArray(selectedClass.examples) && selectedClass.examples.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-200 mb-2">Examples:</h4>
                  {selectedClass.examples.map((example, index) => (
                    <div key={index} className="my-2 p-4 bg-gray-800 rounded-md shadow-inner text-sm prose prose-invert bg-gray-900 text-green-300 rounded-md p-4 font-mono text-sm shadow-inner">
                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{example}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              )}
              <StringList title="Implements" items={selectedClass.implements} />
              {/* Dev Notes and TODOs only in dev mode */}
              {devMode && <StringList title="Dev Notes" items={selectedClass.devNotes} />}
              {devMode && <StringList title="TODOs" items={selectedClass.todos} />}
              <StringList title="Requires" items={selectedClass.requires} />

              {/* Constructors Section */}
              {Array.isArray(visibleConstructors) && visibleConstructors.length > 0 && (
                <>
                  <h3 id="constructors-section" className="text-3xl font-semibold text-white mb-4 border-b border-gray-600 pb-2 mt-8">Constructors</h3>
                  {visibleConstructors.map((method, index) => (
                    <MethodConstructorDetail key={index} method={method} id={method.name.replace(/\s+/g, '-') + '-detail'} highlight={highlightedMember === method.name} parentName={selectedClass.name} />
                  ))}
                </>
              )}

              {/* Properties Section */}
              {Array.isArray(visibleProperties) && visibleProperties.length > 0 && (
                <>
                  <h3 id="properties-section" className="text-3xl font-semibold text-white mb-4 border-b border-gray-600 pb-2 mt-8">Properties</h3>
                  {visibleProperties.map((prop, index) => (
                    <PropertyDetail key={index} property={prop} id={prop.name.replace(/\s+/g, '-') + '-detail'} highlight={highlightedMember === prop.name} parentName={selectedClass.name} />
                  ))}
                </>
              )}

              {/* Methods Section (excluding constructors) */}
              {Array.isArray(visibleMethods) && visibleMethods.length > 0 && (
                <>
                  <h3 id="methods-section" className="text-3xl font-semibold text-white mb-4 border-b border-gray-600 pb-2 mt-8">Methods</h3>
                  {visibleMethods.map((method, index) => (
                    <MethodConstructorDetail key={index} method={method} id={method.name.replace(/\s+/g, '-') + '-detail'} highlight={highlightedMember === method.name} parentName={selectedClass.name} />
                  ))}
                </>
              )}

              {/* Events Section */}
              {Array.isArray(visibleEvents) && visibleEvents.length > 0 && (
                <>
                  <h3 id="events-section" className="text-3xl font-semibold text-white mb-4 border-b border-gray-600 pb-2 mt-8">Events</h3>
                  {visibleEvents.map((event, index) => (
                    <EventDetail key={index} event={event} id={event.name.replace(/\s+/g, '-') + '-detail'} highlight={highlightedMember === event.name} parentName={selectedClass.name} />
                  ))}
                </>
              )}
            </div>
          );
        case 'module':
          const selectedModule = data.modules.find(m => m.name === selectedItem.name);
          if (!selectedModule) return <div className="p-8 text-red-400">Module not found.</div>;
          return (
            <div className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <span className="font-semibold text-lg">Mode:</span>
                <button
                  onClick={handleToggleMode}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors duration-200 focus:outline-none shadow-md
                    ${devMode ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white'}`}
                >
                  {devMode ? 'Dev mode' : 'User mode'}
                </button>
              </div>
              <h2 className="text-4xl font-bold text-blue-400 mb-4 rounded-md p-2 bg-gray-800 shadow-lg">{String(selectedModule.name)}</h2>
              <p className="text-lg text-gray-300 mb-6">
                <span className="prose prose-invert">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{selectedModule.description || ''}</ReactMarkdown>
                </span>
              </p>

              <StringList title="Remarks" items={selectedModule.remarks} />
              {Array.isArray(selectedModule.examples) && selectedModule.examples.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-200 mb-2">Examples:</h4>
                  {selectedModule.examples.map((example, index) => (
                    <div key={index} className="my-2 p-4 bg-gray-800 rounded-md shadow-inner text-sm prose prose-invert bg-gray-900 text-green-300 rounded-md p-4 font-mono text-sm shadow-inner">
                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{example}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              )}
              {/* Dev Notes and TODOs only in dev mode */}
              {devMode && <StringList title="Dev Notes" items={selectedModule.devNotes} />}
              {devMode && <StringList title="TODOs" items={selectedModule.todos} />}
              <StringList title="Requires" items={selectedModule.requires} />

              {Array.isArray(selectedModule.functions) && selectedModule.functions.length > 0 && (
                <>
                  <h3 id="functions-section" className="text-3xl font-semibold text-white mb-4 border-b border-gray-600 pb-2">Functions</h3>
                  {selectedModule.functions.map((func, index) => (
                    <FunctionDetail key={index} func={func} id={func.name.replace(/\s+/g, '-') + '-detail'} highlight={highlightedMember === func.name} parentName={selectedModule.name} />
                  ))}
                </>
              )}
            </div>
          );
        default:
          return (
            <div className="p-8 text-gray-300">
              <h2 className="text-4xl font-bold text-blue-400 mb-4">Welcome to stdVBA Documentation</h2>
              <p className="text-lg">Select a class or module from the sidebar to view its documentation.</p>
              <p className="mt-4">This documentation provides details on VBA classes, properties, methods, and functions, including parameters and code examples.</p>
              <div className="mt-8 p-6 bg-gray-800 rounded-md shadow-lg">
                <h3 className="text-2xl font-semibold text-green-400 mb-3">Key Features:</h3>
                <ul className="list-disc list-inside text-gray-300 text-lg">
                  <li className="mb-2">Comprehensive details for Classes and Modules.</li>
                  <li className="mb-2">Clear descriptions of Properties, Methods, and Functions.</li>
                  <li className="mb-2">Detailed parameter and return type information.</li>
                  <li className="mb-2">Practical code examples for quick understanding.</li>
                </ul>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="flex flex-row h-screen bg-gray-900 text-gray-100 font-inter">
        {/* Left Sidebar */}
        <aside className={`p-3 transition-all duration-300 ease-in-out z-30 bg-gray-800 border-r border-gray-700 shadow-lg overflow-y-auto
          ${isLeftPanelMinimized && !isLeftPanelOpenMobile ? 'w-16' : 'w-64'}`}
        >
          <button
            onClick={toggleLeftPanelDesktop}
            className="top-2 right-2 text-white p-1 rounded-full hover:bg-gray-700 focus:outline-none z-10 hidden md:block"
            title={isLeftPanelMinimized ? "Expand Left Panel" : "Minimize Left Panel"}
          >
            {isLeftPanelMinimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {(!isLeftPanelMinimized || isLeftPanelOpenMobile) ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-gray-700 tracking-wide">stdVBA Docs</h1>
              {/* Classes Navigation */}
              <nav className="mb-8">
                <h2 className="text-xl font-semibold text-gray-400 mb-4 uppercase tracking-wider">Classes</h2>
                <ul>
                  {data.classes.slice().sort((a, b) => a.name.localeCompare(b.name)).map((cls) => (
                    <li key={cls.name} className="mb-2">
                      <button
                        onClick={() => setSelectedItem({ type: 'class', name: cls.name })}
                        className={`block w-full text-left py-2 px-4 rounded-lg transition-all duration-200 font-medium
                          ${selectedItem && selectedItem.type === 'class' && selectedItem.name === cls.name
                            ? 'bg-blue-600 text-white shadow-inner'
                            : 'hover:bg-gray-700 hover:text-blue-400 text-gray-200'
                          }`}
                      >
                        <span className="font-bold text-blue-400 mr-2">C</span> {cls.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Modules Navigation */}
              <nav>
                <h2 className="text-xl font-semibold text-gray-400 mb-4 uppercase tracking-wider">Modules</h2>
                <ul>
                  {data.modules.slice().sort((a, b) => a.name.localeCompare(b.name)).map((mod) => (
                    <li key={mod.name} className="mb-2">
                      <button
                        onClick={() => setSelectedItem({ type: 'module', name: mod.name })}
                        className={`block w-full text-left py-2 px-4 rounded-lg transition-all duration-200 font-medium
                          ${selectedItem && selectedItem.type === 'module' && selectedItem.name === mod.name
                            ? 'bg-blue-600 text-white shadow-inner'
                            : 'hover:bg-gray-700 hover:text-blue-400 text-gray-200'
                          }`}
                      >
                        <span className="font-bold text-green-400 mr-2">M</span> {mod.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full pt-8">
              <h1 className="text-2xl font-bold text-white mb-4 -rotate-90 whitespace-nowrap">stdVBA</h1>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto px-6 py-8 bg-gray-900">
          {/* Mobile Header/Toggle Buttons */}
          <div className="flex justify-between items-center p-4 bg-gray-800 md:hidden sticky top-0 z-10 shadow-md rounded-b-xl mb-6">
            <button onClick={openLeftPanelMobile} className="text-white p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">stdVBA Docs</h1>
            {selectedItem && (
              <button onClick={openRightPanelMobile} className="text-white p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-all duration-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
              </button>
            )}
            {!selectedItem && <div className="w-12"></div>}
          </div>
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* RHS Panel: On This Page */}
        {selectedItem && (
          <aside className={`pt-4 transition-all duration-300 ease-in-out z-30 bg-gray-800 border-l border-gray-700 shadow-lg overflow-y-auto sticky top-0 h-screen
            ${isRightPanelMinimized && !isRightPanelOpenMobile ? 'w-16' : 'w-64'}`}
          >
            <button
              onClick={toggleRightPanelDesktop}
              className="absolute top-2 left-2 text-white p-1 rounded-full hover:bg-gray-700 focus:outline-none z-10 hidden md:block"
              title={isRightPanelMinimized ? "Expand Right Panel" : "Minimize Right Panel"}
            >
              {isRightPanelMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {(!isRightPanelMinimized || isRightPanelOpenMobile) ? (
              <OnThisPagePanel
                selectedItem={
                  selectedItem.type === 'class'
                    ? data.classes.find(c => c.name === selectedItem.name)
                    : data.modules.find(m => m.name === selectedItem.name)
                }
                mainContentRef={mainContentRef}
                devMode={devMode}
                highlightedMember={highlightedMember}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full pt-8">
                <span className="text-white text-lg font-bold rotate-90 whitespace-nowrap">On This Page</span>
              </div>
            )}
          </aside>
        )}
      </div>
    );
  }

export default App;
