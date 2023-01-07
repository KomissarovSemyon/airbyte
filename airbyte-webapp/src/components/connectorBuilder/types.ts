import { JSONSchema7 } from "json-schema";
import isEqual from "lodash/isEqual";
import { v4 as uuid } from "uuid";
import * as yup from "yup";

import { AirbyteJSONSchema } from "core/jsonSchema/types";
import {
  ConnectorManifest,
  InterpolatedRequestOptionsProvider,
  Spec,
  ApiKeyAuthenticator,
  BasicHttpAuthenticator,
  BearerAuthenticator,
  DeclarativeStream,
  NoAuth,
  SessionTokenAuthenticator,
  RequestOption,
  OAuthAuthenticator,
  DefaultPaginatorPaginationStrategy,
  SimpleRetrieverStreamSlicer,
  HttpRequesterAuthenticator,
  SubstreamSlicer,
  SubstreamSlicerType,
  CartesianProductStreamSlicer,
  DatetimeStreamSlicer,
  ListStreamSlicer,
  InlineSchemaLoader,
} from "core/request/ConnectorManifest";

export interface BuilderFormInput {
  key: string;
  required: boolean;
  definition: AirbyteJSONSchema;
}

type BuilderFormAuthenticator = (
  | NoAuth
  | (Omit<OAuthAuthenticator, "refresh_request_body"> & {
      refresh_request_body: Array<[string, string]>;
    })
  | ApiKeyAuthenticator
  | BearerAuthenticator
  | BasicHttpAuthenticator
  | SessionTokenAuthenticator
) & { type: string };

export interface BuilderFormValues {
  global: {
    connectorName: string;
    urlBase: string;
    authenticator: BuilderFormAuthenticator;
  };
  inputs: BuilderFormInput[];
  inferredInputOverrides: Record<string, Partial<AirbyteJSONSchema>>;
  streams: BuilderStream[];
}

export interface BuilderPaginator {
  strategy: DefaultPaginatorPaginationStrategy;
  pageTokenOption: RequestOption;
  pageSizeOption?: RequestOption;
}

export interface BuilderSubstreamSlicer {
  type: SubstreamSlicerType;
  parent_key: string;
  stream_slice_field: string;
  parentStreamReference: string;
  request_option?: RequestOption;
}

export interface BuilderCartesianProductSlicer {
  type: "CartesianProductStreamSlicer";
  stream_slicers: Array<
    Exclude<SimpleRetrieverStreamSlicer, SubstreamSlicer | CartesianProductStreamSlicer> | BuilderSubstreamSlicer
  >;
}

export interface BuilderStream {
  id: string;
  name: string;
  urlPath: string;
  fieldPointer: string[];
  primaryKey: string[];
  httpMethod: "GET" | "POST";
  requestOptions: {
    requestParameters: Array<[string, string]>;
    requestHeaders: Array<[string, string]>;
    requestBody: Array<[string, string]>;
  };
  paginator?: BuilderPaginator;
  streamSlicer?:
    | Exclude<SimpleRetrieverStreamSlicer, SubstreamSlicer | CartesianProductStreamSlicer>
    | BuilderSubstreamSlicer
    | BuilderCartesianProductSlicer;
  schema?: string;
}

export const DEFAULT_BUILDER_FORM_VALUES: BuilderFormValues = {
  global: {
    connectorName: "",
    urlBase: "",
    authenticator: { type: "NoAuth" },
  },
  inputs: [],
  inferredInputOverrides: {},
  streams: [],
};

export const DEFAULT_BUILDER_STREAM_VALUES: Omit<BuilderStream, "id"> = {
  name: "",
  urlPath: "",
  fieldPointer: [],
  primaryKey: [],
  httpMethod: "GET",
  requestOptions: {
    requestParameters: [],
    requestHeaders: [],
    requestBody: [],
  },
};

function getInferredInputList(global: BuilderFormValues["global"]): BuilderFormInput[] {
  if (global.authenticator.type === "ApiKeyAuthenticator") {
    return [
      {
        key: "api_key",
        required: true,
        definition: {
          type: "string",
          title: "API Key",
          airbyte_secret: true,
        },
      },
    ];
  }
  if (global.authenticator.type === "BearerAuthenticator") {
    return [
      {
        key: "api_key",
        required: true,
        definition: {
          type: "string",
          title: "API Key",
          airbyte_secret: true,
        },
      },
    ];
  }
  if (global.authenticator.type === "BasicHttpAuthenticator") {
    return [
      {
        key: "username",
        required: true,
        definition: {
          type: "string",
          title: "Username",
        },
      },
      {
        key: "password",
        required: true,
        definition: {
          type: "string",
          title: "Password",
          airbyte_secret: true,
        },
      },
    ];
  }
  if (global.authenticator.type === "OAuthAuthenticator") {
    return [
      {
        key: "client_id",
        required: true,
        definition: {
          type: "string",
          title: "Client ID",
          airbyte_secret: true,
        },
      },
      {
        key: "client_secret",
        required: true,
        definition: {
          type: "string",
          title: "Client secret",
          airbyte_secret: true,
        },
      },
      {
        key: "refresh_token",
        required: true,
        definition: {
          type: "string",
          title: "Refresh token",
          airbyte_secret: true,
        },
      },
    ];
  }
  if (global.authenticator.type === "SessionTokenAuthenticator") {
    return [
      {
        key: "username",
        required: false,
        definition: {
          type: "string",
          title: "Username",
        },
      },
      {
        key: "password",
        required: false,
        definition: {
          type: "string",
          title: "Password",
          airbyte_secret: true,
        },
      },
      {
        key: "session_token",
        required: false,
        definition: {
          type: "string",
          title: "Session token",
          description: "Session token generated by user (if provided username and password are not required)",
          airbyte_secret: true,
        },
      },
    ];
  }
  return [];
}

export function getInferredInputs(
  global: BuilderFormValues["global"],
  inferredInputOverrides: BuilderFormValues["inferredInputOverrides"]
): BuilderFormInput[] {
  const inferredInputs = getInferredInputList(global);
  return inferredInputs.map((input) =>
    inferredInputOverrides[input.key]
      ? {
          ...input,
          definition: { ...input.definition, ...inferredInputOverrides[input.key] },
        }
      : input
  );
}

export const injectIntoValues = ["request_parameter", "header", "path", "body_data", "body_json"];
const nonPathRequestOptionSchema = yup
  .object()
  .shape({
    inject_into: yup.mixed().oneOf(injectIntoValues.filter((val) => val !== "path")),
    field_name: yup.string().required("form.empty.error"),
  })
  .notRequired()
  .default(undefined);

// eslint-disable-next-line no-useless-escape
export const timeDeltaRegex = /^(([\.\d]+?)y)?(([\.\d]+?)m)?(([\.\d]+?)w)?(([\.\d]+?)d)?$/;

const regularSlicerShape = {
  cursor_field: yup.mixed().when("type", {
    is: (val: string) => val !== "SubstreamSlicer" && val !== "CartesianProductStreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  slice_values: yup.mixed().when("type", {
    is: "ListStreamSlicer",
    then: yup.array().of(yup.string()),
    otherwise: (schema) => schema.strip(),
  }),
  request_option: nonPathRequestOptionSchema,
  start_datetime: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  end_datetime: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  step: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string().matches(timeDeltaRegex, "form.pattern.error").required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  datetime_format: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  start_time_option: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: nonPathRequestOptionSchema,
    otherwise: (schema) => schema.strip(),
  }),
  end_time_option: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: nonPathRequestOptionSchema,
    otherwise: (schema) => schema.strip(),
  }),
  stream_state_field_start: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string(),
    otherwise: (schema) => schema.strip(),
  }),
  stream_state_field_end: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string(),
    otherwise: (schema) => schema.strip(),
  }),
  lookback_window: yup.mixed().when("type", {
    is: "DatetimeStreamSlicer",
    then: yup.string(),
    otherwise: (schema) => schema.strip(),
  }),
  parent_key: yup.mixed().when("type", {
    is: "SubstreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  parentStreamReference: yup.mixed().when("type", {
    is: "SubstreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
  stream_slice_field: yup.mixed().when("type", {
    is: "SubstreamSlicer",
    then: yup.string().required("form.empty.error"),
    otherwise: (schema) => schema.strip(),
  }),
};

export const builderFormValidationSchema = yup.object().shape({
  global: yup.object().shape({
    connectorName: yup.string().required("form.empty.error"),
    urlBase: yup.string().required("form.empty.error"),
    authenticator: yup.object({
      header: yup.mixed().when("type", {
        is: (type: string) => type === "ApiKeyAuthenticator" || type === "SessionTokenAuthenticator",
        then: yup.string().required("form.empty.error"),
        otherwise: (schema) => schema.strip(),
      }),
      token_refresh_endpoint: yup.mixed().when("type", {
        is: "OAuthAuthenticator",
        then: yup.string().required("form.empty.error"),
        otherwise: (schema) => schema.strip(),
      }),
      session_token_response_key: yup.mixed().when("type", {
        is: "SessionTokenAuthenticator",
        then: yup.string().required("form.empty.error"),
        otherwise: (schema) => schema.strip(),
      }),
      login_url: yup.mixed().when("type", {
        is: "SessionTokenAuthenticator",
        then: yup.string().required("form.empty.error"),
        otherwise: (schema) => schema.strip(),
      }),
      validate_session_url: yup.mixed().when("type", {
        is: "SessionTokenAuthenticator",
        then: yup.string().required("form.empty.error"),
        otherwise: (schema) => schema.strip(),
      }),
    }),
  }),
  streams: yup.array().of(
    yup.object().shape({
      name: yup.string().required("form.empty.error"),
      urlPath: yup.string().required("form.empty.error"),
      fieldPointer: yup.array().of(yup.string()),
      primaryKey: yup.array().of(yup.string()),
      httpMethod: yup.mixed().oneOf(["GET", "POST"]),
      requestOptions: yup.object().shape({
        requestParameters: yup.array().of(yup.array().of(yup.string())),
        requestHeaders: yup.array().of(yup.array().of(yup.string())),
        requestBody: yup.array().of(yup.array().of(yup.string())),
      }),
      schema: yup.string().test({
        test: (val: string | undefined) => {
          if (!val) {
            return true;
          }
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        message: "connectorBuilder.invalidSchema",
      }),
      paginator: yup
        .object()
        .shape({
          pageSizeOption: nonPathRequestOptionSchema,
          pageTokenOption: yup.object().shape({
            inject_into: yup.mixed().oneOf(injectIntoValues),
            field_name: yup.mixed().when("inject_into", {
              is: "path",
              then: (schema) => schema.strip(),
              otherwise: yup.string().required("form.empty.error"),
            }),
          }),
          strategy: yup
            .object({
              page_size: yup.mixed().when("type", {
                is: (val: string) => ["OffsetIncrement", "PageIncrement"].includes(val),
                then: yup.number().required("form.empty.error"),
                otherwise: yup.number(),
              }),
              cursor_value: yup.mixed().when("type", {
                is: "CursorPagination",
                then: yup.string().required("form.empty.error"),
                otherwise: (schema) => schema.strip(),
              }),
              stop_condition: yup.mixed().when("type", {
                is: "CursorPagination",
                then: yup.string(),
                otherwise: (schema) => schema.strip(),
              }),
              start_from_page: yup.mixed().when("type", {
                is: "PageIncrement",
                then: yup.string(),
                otherwise: (schema) => schema.strip(),
              }),
            })
            .notRequired()
            .default(undefined),
        })
        .notRequired()
        .default(undefined),
      streamSlicer: yup
        .object()
        .shape({
          ...regularSlicerShape,
          stream_slicers: yup.mixed().when("type", {
            is: "CartesianProductStreamSlicer",
            then: yup.array().of(yup.object().shape(regularSlicerShape)),
            otherwise: (schema) => schema.strip(),
          }),
        })
        .notRequired()
        .default(undefined),
    })
  ),
});

function builderToManifestAuthenticator(globalSettings: BuilderFormValues["global"]): HttpRequesterAuthenticator {
  if (globalSettings.authenticator.type === "OAuthAuthenticator") {
    return {
      ...globalSettings.authenticator,
      refresh_request_body: Object.fromEntries(globalSettings.authenticator.refresh_request_body),
    };
  }
  if (globalSettings.authenticator.type === "SessionTokenAuthenticator") {
    return {
      ...globalSettings.authenticator,
      api_url: globalSettings.urlBase,
    };
  }
  return globalSettings.authenticator as HttpRequesterAuthenticator;
}

function manifestToBuilderAuthenticator(
  manifestAuthenticator: HttpRequesterAuthenticator,
  streamName?: string
): BuilderFormAuthenticator {
  if (manifestAuthenticator.type === "OAuthAuthenticator") {
    return {
      ...manifestAuthenticator,
      refresh_request_body: Object.entries(manifestAuthenticator.refresh_request_body ?? {}),
    };
  }
  if (manifestAuthenticator.type === "CustomAuthenticator") {
    throw new ManifestCompatibilityError(streamName, "uses a CustomAuthenticator");
  }
  return manifestAuthenticator;
}

function builderToManifestStreamSlicer(
  values: BuilderFormValues,
  slicer: BuilderStream["streamSlicer"],
  visitedStreams: string[]
): SimpleRetrieverStreamSlicer | undefined {
  if (!slicer) {
    return undefined;
  }
  if (slicer.type !== "SubstreamSlicer" && slicer.type !== "CartesianProductStreamSlicer") {
    return slicer;
  }
  if (slicer.type === "CartesianProductStreamSlicer") {
    return {
      type: "CartesianProductStreamSlicer",
      stream_slicers: slicer.stream_slicers.map((subSlicer) => {
        return builderToManifestStreamSlicer(values, subSlicer, visitedStreams);
      }),
    } as unknown as CartesianProductStreamSlicer;
  }
  const parentStream = values.streams.find(({ id }) => id === slicer.parentStreamReference);
  if (!parentStream) {
    return {
      type: "SubstreamSlicer",
      parent_stream_configs: [],
    };
  }
  if (visitedStreams.includes(parentStream.id)) {
    // circular dependency
    return {
      type: "SubstreamSlicer",
      parent_stream_configs: [],
    };
  }
  return {
    type: "SubstreamSlicer",
    parent_stream_configs: [
      {
        type: "ParentStreamConfig",
        parent_key: slicer.parent_key,
        request_option: slicer.request_option,
        stream_slice_field: slicer.stream_slice_field,
        stream: builderStreamToDeclarativeSteam(values, parentStream, visitedStreams),
      },
    ],
  };
}

function manifestToBuilderStreamSlicer(
  manifestStreamSlicer: SimpleRetrieverStreamSlicer,
  streamName?: string
): NonNullable<BuilderStream["streamSlicer"]> {
  if (manifestStreamSlicer.type === undefined) {
    throw new ManifestCompatibilityError(streamName, "stream_slicer has no type");
  }

  if (manifestStreamSlicer.type === "CustomStreamSlicer") {
    throw new ManifestCompatibilityError(streamName, "stream_slicer contains a CustomStreamSlicer");
  }

  if (manifestStreamSlicer.type === "SingleSlice") {
    throw new ManifestCompatibilityError(streamName, "stream_slicer contains a SingleSlice");
  }

  if (manifestStreamSlicer.type === "DatetimeStreamSlicer" || manifestStreamSlicer.type === "ListStreamSlicer") {
    return manifestStreamSlicer as DatetimeStreamSlicer | ListStreamSlicer;
  }

  if (manifestStreamSlicer.type === "CartesianProductStreamSlicer") {
    return {
      type: "CartesianProductStreamSlicer",
      stream_slicers: manifestStreamSlicer.stream_slicers.map((subSlicer) => {
        return manifestToBuilderStreamSlicer(subSlicer, streamName) as
          | Exclude<SimpleRetrieverStreamSlicer, SubstreamSlicer | CartesianProductStreamSlicer>
          | BuilderSubstreamSlicer;
      }),
    };
  }

  // TODO: add support for substream slicer..
  // This will be fairly complex as it would need to compare the manifestStreamSlicer's parent stream configs' streams to every other stream in the manifest to find one with an exact match,
  // and once it does it will need to map that back to the id that was assigned to that stream, which may not have been assigned yet since this conversion is happening stream by stream...
  if (manifestStreamSlicer.type === "SubstreamSlicer") {
    throw new ManifestCompatibilityError(streamName, "stream_slicer contains a SubstreamSlicer");
  }

  throw new ManifestCompatibilityError(streamName, "stream_slicer type is unsupported");
}

function parseSchemaString(schema?: string) {
  if (!schema) {
    return undefined;
  }
  try {
    return { type: "InlineSchemaLoader", schema: JSON.parse(schema) };
  } catch {
    return undefined;
  }
}

function builderStreamToDeclarativeSteam(
  values: BuilderFormValues,
  stream: BuilderStream,
  visitedStreams: string[]
): DeclarativeStream {
  return {
    type: "DeclarativeStream",
    name: stream.name,
    primary_key: stream.primaryKey,
    schema_loader: parseSchemaString(stream.schema),
    retriever: {
      type: "SimpleRetriever",
      name: stream.name,
      primary_key: stream.primaryKey,
      requester: {
        type: "HttpRequester",
        name: stream.name,
        url_base: values.global?.urlBase,
        path: stream.urlPath,
        request_options_provider: {
          // TODO can't declare type here because the server will error out, but the types dictate it is needed. Fix here once server is fixed.
          // type: "InterpolatedRequestOptionsProvider",
          request_parameters: Object.fromEntries(stream.requestOptions.requestParameters),
          request_headers: Object.fromEntries(stream.requestOptions.requestHeaders),
          request_body_json: Object.fromEntries(stream.requestOptions.requestBody),
        } as InterpolatedRequestOptionsProvider,
        authenticator: builderToManifestAuthenticator(values.global),
      },
      record_selector: {
        type: "RecordSelector",
        extractor: {
          type: "DpathExtractor",
          field_pointer: stream.fieldPointer,
        },
      },
      paginator: stream.paginator
        ? {
            type: "DefaultPaginator",
            page_token_option: {
              ...stream.paginator.pageTokenOption,
              // ensures that empty field_name is not set, as connector builder server cannot accept a field_name if inject_into is set to 'path'
              field_name: stream.paginator.pageTokenOption?.field_name
                ? stream.paginator.pageTokenOption?.field_name
                : undefined,
            },
            page_size_option: stream.paginator.pageSizeOption,
            pagination_strategy: stream.paginator.strategy,
            url_base: values.global?.urlBase,
          }
        : { type: "NoPagination" },
      stream_slicer: builderToManifestStreamSlicer(values, stream.streamSlicer, [...visitedStreams, stream.id]),
    },
  };
}

export const convertToManifest = (values: BuilderFormValues): ConnectorManifest => {
  const manifestStreams: DeclarativeStream[] = values.streams.map((stream) =>
    builderStreamToDeclarativeSteam(values, stream, [])
  );

  const allInputs = [...values.inputs, ...getInferredInputs(values.global, values.inferredInputOverrides)];

  const specSchema: JSONSchema7 = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: allInputs.filter((input) => input.required).map((input) => input.key),
    properties: Object.fromEntries(allInputs.map((input) => [input.key, input.definition])),
    additionalProperties: true,
  };

  const spec: Spec = {
    connection_specification: specSchema,
    documentation_url: "",
    type: "Spec",
  };

  return {
    version: "0.1.0",
    type: "DeclarativeSource",
    check: {
      type: "CheckStream",
      stream_names: [],
    },
    streams: manifestStreams,
    spec,
  };
};

export const convertToBuilderFormValues = (
  manifest: ConnectorManifest,
  currentBuilderFormValues: BuilderFormValues
) => {
  const builderFormValues = DEFAULT_BUILDER_FORM_VALUES;
  builderFormValues.global.connectorName = currentBuilderFormValues.global.connectorName;

  console.log("test");

  const streams = manifest.streams;
  if (streams && streams.length > 0) {
    if (streams[0].retriever.type !== "SimpleRetriever") {
      throw new ManifestCompatibilityError(streams[0].name, "doesn't use a SimpleRetriever");
    }
    builderFormValues.global.urlBase = streams[0].retriever.requester.url_base;
    if (streams[0].retriever.requester.authenticator) {
      builderFormValues.global.authenticator = manifestToBuilderAuthenticator(
        streams[0].retriever.requester.authenticator,
        streams[0].name
      );
    }

    builderFormValues.streams = streams.map((stream) => {
      if (stream.retriever.type !== "SimpleRetriever") {
        throw new ManifestCompatibilityError(stream.name, "doesn't use a SimpleRetriever");
      }

      const retriever = stream.retriever;
      const requester = retriever.requester;

      if (!isEqual(retriever.requester.authenticator, builderFormValues.global.authenticator)) {
        throw new ManifestCompatibilityError(stream.name, "authenticator does not match the first stream's");
      }

      if (retriever.requester.url_base !== builderFormValues.global.urlBase) {
        throw new ManifestCompatibilityError(stream.name, "url_base does not match the first stream's");
      }

      const builderStream = {
        ...DEFAULT_BUILDER_STREAM_VALUES,
        id: uuid(),
        name: stream.name ?? "",
        urlPath: requester.path,
        fieldPointer: retriever.record_selector.extractor.field_pointer,
        requestParameters: Object.entries(requester.request_options_provider?.request_parameters ?? {}),
        requestHeaders: Object.entries(requester.request_options_provider?.request_headers ?? {}),
        // try getting this from request_body_data first, and if not set then pull from request_body_json
        requestBody: Object.entries(
          requester.request_options_provider?.request_body_data ??
            requester.request_options_provider?.request_body_json ??
            {}
        ),
      };

      if (![undefined, "GET", "POST"].includes(requester.http_method)) {
        throw new ManifestCompatibilityError(stream.name, "http_method is not GET or POST");
      } else {
        builderStream.httpMethod = (requester.http_method as "GET" | "POST" | undefined) ?? "GET";
      }

      console.log("stream.primary_key", stream.primary_key);
      if (retriever.primary_key === undefined) {
        builderStream.primaryKey = [];
      } else if (Array.isArray(retriever.primary_key)) {
        if (retriever.primary_key.length > 0 && Array.isArray(retriever.primary_key[0])) {
          throw new ManifestCompatibilityError(stream.name, "primary_key contains nested arrays");
        } else {
          builderStream.primaryKey = retriever.primary_key as string[];
        }
      } else {
        builderStream.primaryKey = [retriever.primary_key];
      }

      if (retriever.paginator && retriever.paginator.type === "DefaultPaginator") {
        if (retriever.paginator.page_token_option === undefined) {
          throw new ManifestCompatibilityError(stream.name, "paginator does not define a page_token_option");
        }

        if (retriever.paginator.url_base !== builderFormValues.global.urlBase) {
          throw new ManifestCompatibilityError(
            stream.name,
            "paginator.url_base does not match the first stream's url_base"
          );
        }

        builderStream.paginator = {
          strategy: retriever.paginator.pagination_strategy,
          pageTokenOption: retriever.paginator.page_token_option,
          pageSizeOption: retriever.paginator.page_size_option,
        };
      }

      if (retriever.stream_slicer) {
        builderStream.streamSlicer = manifestToBuilderStreamSlicer(retriever.stream_slicer);
      }

      if (stream.schema_loader) {
        if (stream.schema_loader.type === "DefaultSchemaLoader") {
          throw new ManifestCompatibilityError(stream.name, "schema_loader is DefaultSchemaLoader");
        }

        if (stream.schema_loader.type === "JsonFileSchemaLoader") {
          throw new ManifestCompatibilityError(stream.name, "schema_loader is JsonFileSchemaLoader");
        }

        const schemaLoader = stream.schema_loader as InlineSchemaLoader;
        if (schemaLoader.schema) {
          builderStream.schema = JSON.stringify(schemaLoader.schema);
        }
      }

      return builderStream;
    });
  }

  const spec = manifest.spec;
  if (spec) {
    const required = spec.connection_specification.required as string[];
    builderFormValues.inputs = Object.entries(
      spec.connection_specification.properties as Record<string, AirbyteJSONSchema>
    ).map(([key, definition]) => {
      return {
        key,
        definition,
        required: required.includes(key),
      };
    });
    // Mot exactly sure how to deal with inferred inputs, because the manifest may contain inputs that are used in the authenticator but are not named the same as inferred inputs
    // Maybe we can verify if the authenticator values point to {{config[]}} values, and if they do then we just rename them, if not then we throw an error?
  }

  return builderFormValues;
};

export class ManifestCompatibilityError extends Error {
  __type = "connectorBuilder.manifestCompatibility";

  constructor(public streamName: string | undefined, public message: string) {
    super(`${streamName ? `Stream ${streamName}: ` : ""} ${message}`);
  }
}

export function isManifestCompatibilityError(error: { __type?: string }): error is ManifestCompatibilityError {
  return error.__type === "connectorBuilder.manifestCompatibility";
}
