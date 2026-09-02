import {
  filterAppointmentContextEntries,
  parseAppointmentDateFilter,
  type AppointmentDateFilter,
} from "@/lib/ai/appointment-query";
import {
  buildDocumentSearchCatalog,
  buildSectionSearchContext,
} from "@/lib/ai/document-search-core";
import {
  appointmentDescriptionDisplay,
  appointmentTagLabel,
  appointmentTitleDisplay,
  getSeriesMembers,
  type AppointmentSeriesRecord,
} from "@/lib/appointment-format";
import { collapseAppointmentSeries } from "@/lib/appointments-upcoming";
import type { DocumentNodeRecord } from "@/lib/documents";

export type AiAppointmentContextEntry = {
  title: string;
  date: string;
  endDate?: string;
  description?: string;
  tag?: string;
  priority?: "important" | "normal";
};

export type AiWorkspaceContext = {
  app: string;
  features: string[];
  search: {
    matches: string[];
    tip: string;
  };
  pages: Array<{
    title: string;
    section?: string;
    location?: string;
    description?: string;
  }>;
  sections: Array<{
    title: string;
    documents: string[];
    folders: string[];
  }>;
  appointments: {
    range: {
      start: string;
      end: string;
    };
    queryFilter?: {
      label: string;
      matchedCount: number;
    };
    items: AiAppointmentContextEntry[];
  };
};

const APP_FEATURES = [
  "Home — AI search for documents and workspace help",
  "Documents — study notes and folders",
  "Appointments — schedule and deadlines",
  "Announces — announcement boards and work updates",
  "News — announcements and feed",
];

const AI_APPOINTMENT_DESCRIPTION_MAX_LENGTH = 240;

function serializeAppointmentForAi(
  record: AppointmentSeriesRecord,
  allAppointments: AppointmentSeriesRecord[]
): AiAppointmentContextEntry {
  const title = appointmentTitleDisplay(record.title);
  const description = appointmentDescriptionDisplay(record.description);
  const tag = appointmentTagLabel(record);
  const seriesMembers = getSeriesMembers(record, allAppointments);
  const startDate = record.scheduled_date.slice(0, 10);
  const endDate =
    seriesMembers.length > 1
      ? seriesMembers[seriesMembers.length - 1]?.scheduled_date.slice(0, 10)
      : undefined;

  return {
    title,
    date: startDate,
    ...(endDate && endDate !== startDate ? { endDate } : {}),
    ...(description
      ? {
          description:
            description.length > AI_APPOINTMENT_DESCRIPTION_MAX_LENGTH
              ? `${description.slice(0, AI_APPOINTMENT_DESCRIPTION_MAX_LENGTH).trim()}…`
              : description,
        }
      : {}),
    ...(tag ? { tag } : {}),
    ...(record.tone === "red"
      ? { priority: "important" as const }
      : record.tone === "blue"
        ? { priority: "normal" as const }
        : {}),
  };
}

export function buildAppointmentAiContext(
  appointments: AppointmentSeriesRecord[],
  dateFilter: AppointmentDateFilter | null = null
): AiWorkspaceContext["appointments"] {
  const collapsed = collapseAppointmentSeries(appointments);
  const allItems = collapsed.map((record) =>
    serializeAppointmentForAi(record, appointments)
  );
  const items = filterAppointmentContextEntries(allItems, dateFilter);

  const dates = appointments.map((item) => item.scheduled_date.slice(0, 10));
  const sortedDates = [...dates].sort();

  return {
    range: {
      start: sortedDates[0] ?? "",
      end: sortedDates[sortedDates.length - 1] ?? "",
    },
    ...(dateFilter
      ? {
          queryFilter: {
            label: dateFilter.label,
            matchedCount: items.length,
          },
        }
      : {}),
    items,
  };
}

export function buildAiWorkspaceContext(
  nodes: DocumentNodeRecord[],
  appointments: AppointmentSeriesRecord[] = [],
  options?: { appointmentQuery?: string; referenceDate?: Date }
): AiWorkspaceContext {
  const catalog = buildDocumentSearchCatalog(nodes);
  const dateFilter = options?.appointmentQuery
    ? parseAppointmentDateFilter(
        options.appointmentQuery,
        options.referenceDate ?? new Date()
      )
    : null;

  return {
    app: "Shi studygram",
    features: APP_FEATURES,
    search: {
      matches: [
        "document title",
        "document description",
        "section and folder path",
        "text inside document pages",
      ],
      tip: "Users can type any topic, phrase, or keyword from inside a document — not only the document name.",
    },
    pages: catalog.map((entry) => ({
      title: entry.title,
      section: entry.sectionTitle,
      location: entry.locationContext,
      description: entry.description,
    })),
    sections: buildSectionSearchContext(nodes),
    appointments: buildAppointmentAiContext(appointments, dateFilter),
  };
}

export function formatAiWorkspaceContext(context: AiWorkspaceContext) {
  return JSON.stringify(context);
}
