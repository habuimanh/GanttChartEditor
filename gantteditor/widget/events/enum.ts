export enum EVENT {
    USER_CHANGE_TASK_START_DATE_AND_DURATION = "user_change_task_start_date_and_duration",
    USER_CHANGE_TASK_PROGRESS = "user_change_task_progress",
    USER_ADD_TASK = "user_add_task",
    USER_EDIT_TASK = "user_edit_task",
    USER_DELETE_TASK = "user_delete_task",
    USER_ADD_LINK = "user_add_link",

    USER_DELETE_LINK = "user_delete_link",
    USER_EDIT_LINK = "user_edit_link",
    USER_CALL_MICROFLOW = "user_call_microflow",
    USER_MOVE_TASK = "user_move_task",

    SERVER_UPDATE_CONTEXT_OBJECT = "server_update_context_object",
    SERVER_UPDATE_DATA = "server_update_data",
    SERVER_UPDATE_OBJECT = "server_update_object",
    SERVER_REMOVE_OBJECT = "server_remove_object",

    STORE_UPDATE_DATA = "store_update_data",
    STORE_UPDATE_LINK = "store_update_link",
    STORE_UPDATE_TASK = "store_update_task",
    STORE_ADD_TASK = "store_add_task",
    STORE_DELETE_TASK = "store_delete_task",
    STORE_DELETE_LINK = "store_delete_link",

    GANTT_INITIALIZED = "gantt_initialize",
    DESTROY = "destroy",
}